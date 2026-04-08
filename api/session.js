function parseCookies(cookieHeader) {
  const out = {};
  if (!cookieHeader) return out;
  cookieHeader.split(';').forEach((part) => {
    const i = part.indexOf('=');
    if (i > -1) {
      const key = part.slice(0, i).trim();
      const val = part.slice(i + 1).trim();
      out[key] = val;
    }
  });
  return out;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const sessionToken = process.env.APP_SESSION_TOKEN;
  if (!sessionToken) {
    return res.status(500).json({ message: 'Server auth is not configured' });
  }

  const cookies = parseCookies(req.headers.cookie || '');
  if (cookies.app_session !== sessionToken) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  return res.status(200).json({ ok: true });
}
