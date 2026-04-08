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
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(204).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const sessionToken = process.env.APP_SESSION_TOKEN;

  if (!token || !repo || !sessionToken) {
    return res.status(500).json({ message: 'Server missing GITHUB_TOKEN, GITHUB_REPO, or APP_SESSION_TOKEN' });
  }

  const cookies = parseCookies(req.headers.cookie || '');
  if (cookies.app_session !== sessionToken) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  const { path, message, content } = req.body || {};

  if (!path || !message || !content) {
    return res.status(400).json({ message: 'Missing fields: path, message, content' });
  }

  try {
    const githubUrl = `https://api.github.com/repos/${repo}/contents/${path}`;
    const ghRes = await fetch(githubUrl, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'autobiography-template-vercel'
      },
      body: JSON.stringify({ message, content })
    });

    const data = await ghRes.json();
    return res.status(ghRes.status).json(data);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Unexpected server error' });
  }
}
