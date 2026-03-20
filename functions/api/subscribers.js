/**
 * Sacred Banana — Subscriber List (Admin)
 * GET /api/subscribers?secret=YOUR_SECRET
 *
 * Returns all subscribers from KV as JSON list.
 * Protected by a secret token set as environment variable NOTIFY_SECRET.
 */

export async function onRequestGet(context) {
  var env = context.env;
  var url = new URL(context.request.url);
  var secret = url.searchParams.get('secret');

  // Auth check
  if (!env.NOTIFY_SECRET || secret !== env.NOTIFY_SECRET) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!env.SUBSCRIBERS) {
    return new Response(JSON.stringify({ error: 'KV not bound' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    // Fetch all keys (paginated, max 1000 per call)
    var allSubscribers = [];
    var cursor = null;
    var done = false;

    while (!done) {
      var opts = { limit: 1000 };
      if (cursor) opts.cursor = cursor;
      var list = await env.SUBSCRIBERS.list(opts);

      for (var i = 0; i < list.keys.length; i++) {
        var key = list.keys[i].name;
        var val = await env.SUBSCRIBERS.get(key);
        try {
          var data = JSON.parse(val);
          allSubscribers.push(data);
        } catch(e) {
          allSubscribers.push({ email: key, raw: val });
        }
      }

      if (list.list_complete) {
        done = true;
      } else {
        cursor = list.cursor;
      }
    }

    // Sort by date (newest first)
    allSubscribers.sort(function(a, b) {
      return (b.subscribedAt || '').localeCompare(a.subscribedAt || '');
    });

    return new Response(JSON.stringify({
      total: allSubscribers.length,
      subscribers: allSubscribers,
    }, null, 2), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
