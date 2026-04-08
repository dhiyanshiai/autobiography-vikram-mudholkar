function setCookie(name, value, maxAgeSeconds) {
  return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const expectedUser = process.env.APP_LOGIN_USERNAME;
  const expectedPass = process.env.APP_LOGIN_PASSWORD;
  const sessionToken = process.env.APP_SESSION_TOKEN;

  if (!expectedUser || !expectedPass || !sessionToken) {
    return res.status(500).json({ message: 'Server auth is not configured' });
  }

  const body = req.body || {};
  const username = String(body.username || '');
  const password = String(body.password || '');

  if (username !== expectedUser || password !== expectedPass) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  res.setHeader('Set-Cookie', setCookie('app_session', sessionToken, 60 * 60 * 24 * 7));
  return res.status(200).json({ ok: true });
}
