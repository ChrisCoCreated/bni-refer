const RECIPIENT_EMAIL = 'chris@thrivehomecare.co.uk';

function normalizeText(value) {
  return String(value || '').replace(/\r\n/g, '\n').trim();
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
    goals: normalizeText(body.goals),
  };

  if (!data.fullName || !data.email || !data.goals) {
    return res.status(400).json({ error: 'Name, email, and goals are required.' });
  }

  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
    return res.status(400).json({ error: 'Please enter a valid email address.' });
  }

  return res.status(200).json({
    ok: true,
    recipient: RECIPIENT_EMAIL,
  });
};
