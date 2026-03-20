/**
 * Sacred Banana — New Subscriber Notification
 * POST /api/notify (internal, called by subscribe.js)
 *
 * Sends email notification to info@sacredbanana.com when a new subscriber signs up.
 * Uses MailChannels API (free for Cloudflare Workers with SPF configured).
 */

export async function onRequestPost(context) {
  var request = context.request;
  var env = context.env;

  // Only allow internal calls with correct secret
  var authHeader = request.headers.get('X-Notify-Secret');
  if (!env.NOTIFY_SECRET || authHeader !== env.NOTIFY_SECRET) {
    return new Response('Unauthorized', { status: 401 });
  }

  try {
    var body = await request.json();
    var newEmail = body.email || 'unknown';
    var totalCount = body.total || '?';

    // Send via MailChannels (free for Cloudflare Workers)
    var emailBody = [
      'Neuer Sacred Banana Subscriber!',
      '',
      'Email: ' + newEmail,
      'Zeitpunkt: ' + new Date().toISOString(),
      'Gesamt-Subscriber: ' + totalCount,
      '',
      '---',
      'Alle Subscriber einsehen:',
      'https://sacredbanana.com/api/subscribers?secret=' + env.NOTIFY_SECRET,
      '',
      'In Banana We Trust.'
    ].join('\n');

    var res = await fetch('https://api.mailchannels.net/tx/v1/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: 'info@sacredbanana.com', name: 'Sacred Banana' }],
        }],
        from: {
          email: 'noreply@sacredbanana.com',
          name: 'Sacred Banana Bot',
        },
        subject: '[SB] Neuer Subscriber: ' + newEmail + ' (#' + totalCount + ')',
        content: [{
          type: 'text/plain',
          value: emailBody,
        }],
      }),
    });

    if (res.ok || res.status === 202) {
      console.log('[NOTIFY] Email sent for ' + newEmail);
      return new Response('OK', { status: 200 });
    } else {
      var errText = await res.text();
      console.log('[NOTIFY FAIL] ' + res.status + ': ' + errText);
      return new Response('Email failed', { status: 500 });
    }

  } catch (err) {
    console.error('[NOTIFY ERROR]', err.message);
    return new Response('Error', { status: 500 });
  }
}
