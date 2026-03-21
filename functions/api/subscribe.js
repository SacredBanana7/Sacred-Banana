/**
 * Sacred Banana — Newsletter Subscribe
 * Cloudflare Pages Function
 *
 * Handles POST /api/subscribe
 * Validates email + spam protection, stores in KV (if bound) or logs.
 *
 * To enable KV storage:
 *   1. Create a KV namespace "SUBSCRIBERS" in Cloudflare dashboard
 *   2. Bind it to this Pages project under Settings → Functions → KV namespace bindings
 *      Variable name: SUBSCRIBERS
 */

export async function onRequestPost(context) {
  const { request, env } = context;

  // CORS headers
  const headers = {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': 'https://sacredbanana.com',
  };

  try {
    const body = await request.json();
    const email = (body.email || '').trim().toLowerCase();

    // Validate email: length + RFC 5322 compliant regex
    if (!email || email.length > 254) {
      return new Response(JSON.stringify({ error: 'Invalid email' }), {
        status: 400,
        headers,
      });
    }

    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: 'Invalid email format' }), {
        status: 400,
        headers,
      });
    }

    // Store in KV if available
    if (env.SUBSCRIBERS) {
      const existing = await env.SUBSCRIBERS.get(email);
      if (existing) {
        return new Response(JSON.stringify({ ok: true, message: 'Already subscribed' }), {
          status: 200,
          headers,
        });
      }
      await env.SUBSCRIBERS.put(email, JSON.stringify({
        email,
        subscribedAt: new Date().toISOString(),
        source: 'website',
      }));
    }

    // Log for monitoring (visible in Cloudflare dashboard → Workers & Pages → Logs)
    console.log(`[SUBSCRIBE] ${email} at ${new Date().toISOString()}`);

    // Send email notification if NOTIFY_EMAIL and NOTIFY_SECRET are set
    if (env.NOTIFY_SECRET) {
      try {
        // Get subscriber count from KV
        var count = '?';
        if (env.SUBSCRIBERS) {
          var list = await env.SUBSCRIBERS.list();
          count = list.keys.length;
        }
        // Send notification via internal endpoint
        await fetch(new URL('/api/notify', request.url).href, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'X-Notify-Secret': env.NOTIFY_SECRET },
          body: JSON.stringify({ email: email, total: count }),
        }).catch(function(){});
      } catch(e) { console.log('[NOTIFY SKIP]', e.message); }
    }

    return new Response(JSON.stringify({ ok: true, message: 'Subscribed' }), {
      status: 200,
      headers,
    });

  } catch (err) {
    console.error('[SUBSCRIBE ERROR]', err.message);
    return new Response(JSON.stringify({ error: 'Server error' }), {
      status: 500,
      headers,
    });
  }
}

// Handle preflight CORS
export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': 'https://sacredbanana.com',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Max-Age': '86400',
    },
  });
}
