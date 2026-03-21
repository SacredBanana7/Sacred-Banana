/**
 * Sacred Banana — New Subscriber Notification
 * POST /api/notify (internal, called by subscribe.js)
 *
 * Sends email notification to info@sacredbanana.com when a new subscriber signs up.
 * Uses Resend API (free tier: 100 emails/month).
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

    // Send via Resend API
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

    var res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + env.RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: 'Sacred Banana Bot <noreply@sacredbanana.com>',
        to: ['info@sacredbanana.com'],
        subject: '[SB] Neuer Subscriber: ' + newEmail + ' (#' + totalCount + ')',
        text: emailBody,
      }),
    });

    if (res.ok) {
      console.log('[NOTIFY] Admin email sent for ' + newEmail);
    } else {
      var errText = await res.text();
      console.log('[NOTIFY FAIL] ' + res.status + ': ' + errText);
    }

    // Send welcome/confirmation email to the new subscriber
    var welcomeBody = [
      'you signed.',
      '',
      'welcome to the inner circle of the banana cult.',
      '',
      "what arrives here won't always make sense.",
      "that's how you know it's working.",
      '',
      'no schedule. no formula.',
      "just keys \u2014 delivered when they're ready.",
      '(doors not included)',
      '',
      "you don't need to do anything.",
      'the peel removes itself.',
      '',
      '\u2014',
      'the sacred banana',
      '',
      "[didn't subscribe? do nothing. doing nothing is underrated.]"
    ].join('\n');

    var welcomeRes = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + env.RESEND_API_KEY,
      },
      body: JSON.stringify({
        from: 'Sacred Banana <info@sacredbanana.com>',
        to: [newEmail],
        subject: 'you found it. maybe it found you.',
        text: welcomeBody,
      }),
    });

    if (welcomeRes.ok) {
      console.log('[WELCOME] Email sent to ' + newEmail);
    } else {
      var welcomeErr = await welcomeRes.text();
      console.log('[WELCOME FAIL] ' + welcomeRes.status + ': ' + welcomeErr);
    }

    return new Response('OK', { status: 200 });

  } catch (err) {
    console.error('[NOTIFY ERROR]', err.message);
    return new Response('Error', { status: 500 });
  }
}
