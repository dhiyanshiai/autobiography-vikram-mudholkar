function setCookie(name, value, maxAgeSeconds) {
  return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAgeSeconds}`;
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const expectedUser = process.env.APP_LOGIN_USERNAME || 'dhiyanshiai';
  const expectedPass = process.env.APP_LOGIN_PASSWORD || 'saurav';
  const sessionToken = process.env.APP_SESSION_TOKEN || '6b058eb3c83227ef13fe652e79107e66b7d53c1153fe342f8e5260885b829bc7';

  const body = req.body || {};
  const username = String(body.username || '');
  const password = String(body.password || '');

  if (username !== expectedUser || password !== expectedPass) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  res.setHeader('Set-Cookie', setCookie('app_session', sessionToken, 60 * 60 * 24 * 7));
  return res.status(200).json({ ok: true });
}
