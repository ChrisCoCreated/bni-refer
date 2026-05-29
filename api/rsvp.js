const RESEND_API_URL = 'https://api.resend.com/emails';
const RECIPIENT_EMAIL = 'chris@thrivehomecare.co.uk';
const FROM_EMAIL = 'BNI RSVP <onboarding@resend.dev>';
const EVENT_TITLE = 'BNI Care Business Insights';
const EVENT_DATE = '26 July 2026';
const EVENT_TIME = '12:00 pm';

function escapeHtml(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function normalizeText(value) {
  return String(value || '').replace(/\r\n/g, '\n').trim();
}

function bulletize(value) {
  const lines = normalizeText(value)
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => line.replace(/^[-*]\s*/, ''));

  return lines.map((line) => `- ${line}`).join('\n');
}

function buildTextEmail(data) {
  const lines = [
    `New RSVP for ${EVENT_TITLE}`,
    '',
    `Name: ${data.fullName}`,
    `Email: ${data.email}`,
    data.company ? `Company or chapter: ${data.company}` : null,
    '',
    `Event: ${EVENT_DATE} at ${EVENT_TIME}`,
    '',
    'What they want to get out of it:',
    data.goals,
  ].filter(Boolean);

  if (data.questions) {
    lines.push('', 'Specific questions:', data.questions);
  }

  if (data.invitees) {
    lines.push('', 'Other BNI members to invite:', data.invitees);
  }

  lines.push('', 'Reply to this email to respond directly to the attendee.');

  return lines.join('\n');
}

function buildHtmlEmail(data) {
  const sections = [
    `<p><strong>New RSVP for ${escapeHtml(EVENT_TITLE)}</strong></p>`,
    `<p><strong>Name:</strong> ${escapeHtml(data.fullName)}</p>`,
    `<p><strong>Email:</strong> ${escapeHtml(data.email)}</p>`,
    data.company ? `<p><strong>Company or chapter:</strong> ${escapeHtml(data.company)}</p>` : '',
    `<p><strong>Event:</strong> ${escapeHtml(EVENT_DATE)} at ${escapeHtml(EVENT_TIME)}</p>`,
    `<p><strong>What they want to get out of it:</strong><br />${escapeHtml(data.goals).replace(/\n/g, '<br />')}</p>`,
  ].filter(Boolean);

  if (data.questions) {
    sections.push(
      `<p><strong>Specific questions:</strong><br />${escapeHtml(data.questions).replace(/\n/g, '<br />')}</p>`,
    );
  }

  if (data.invitees) {
    sections.push(
      `<p><strong>Other BNI members to invite:</strong><br />${escapeHtml(data.invitees).replace(/\n/g, '<br />')}</p>`,
    );
  }

  sections.push('<p>Reply to this email to respond directly to the attendee.</p>');
  return `<div style="font-family:Segoe UI,Roboto,Helvetica Neue,Arial,sans-serif;line-height:1.6;color:#1f2937">${sections.join('')}</div>`;
}

async function sendEmail(data) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error('Missing RESEND_API_KEY environment variable.');
  }

  const response = await fetch(RESEND_API_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [RECIPIENT_EMAIL],
      reply_to: data.email,
      subject: `${EVENT_TITLE} RSVP - ${data.fullName}`,
      text: buildTextEmail(data),
      html: buildHtmlEmail(data),
      tags: [
        { name: 'event', value: 'care-business-session' },
      ],
    }),
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = payload?.message || payload?.error || 'Unable to send RSVP email.';
    throw new Error(message);
  }

  return payload;
}

function readRequestBody(req) {
  if (req.body !== undefined && req.body !== null) {
    return Promise.resolve(req.body);
  }

  return new Promise((resolve, reject) => {
    let raw = '';

    req.setEncoding('utf8');
    req.on('data', (chunk) => {
      raw += chunk;
    });
    req.on('end', () => {
      if (!raw) {
        resolve(null);
        return;
      }

      try {
        resolve(JSON.parse(raw));
      } catch (error) {
        resolve(raw);
      }
    });
    req.on('error', reject);
  });
}

module.exports = async (req, res) => {
  res.setHeader('Cache-Control', 'no-store');

  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return res.status(405).json({ error: 'Method not allowed.' });
  }

  let body = await readRequestBody(req);
  if (typeof body === 'string') {
    try {
      body = JSON.parse(body);
    } catch (error) {
      body = null;
    }
  }

  if (!body || typeof body !== 'object') {
    return res.status(400).json({ error: 'Invalid request body.' });
  }

  const data = {
    fullName: normalizeText(body.fullName),
    email: normalizeText(body.email),
    company: normalizeText(body.company),
    invitees: normalizeText(body.invitees),
    goals: normalizeText(body.goals),
    questions: normalizeText(body.questions),
  };

  if (!data.fullName || !data.email || !data.goals) {
    return res.status(400).json({ error: 'Name, email, and goals are required.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  try {
    const result = await sendEmail(data);
    return res.status(200).json({ ok: true, id: result.id });
  } catch (error) {
    return res.status(500).json({
      error: 'Could not send the RSVP right now.',
      detail: error.message,
    });
  }
};
