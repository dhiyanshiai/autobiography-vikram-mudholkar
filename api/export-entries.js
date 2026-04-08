import JSZip from 'jszip';

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

function decodeGithubContent(encoded) {
  return Buffer.from(String(encoded || '').replace(/\n/g, ''), 'base64').toString('utf8');
}

async function githubJson(url, token) {
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'autobiography-template-vercel'
    }
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`GitHub API error ${res.status}: ${text}`);
  }

  return res.json();
}

async function listMarkdownFiles(repo, token, path) {
  const url = `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`;
  const data = await githubJson(url, token);

  if (!Array.isArray(data)) {
    return [];
  }

  let files = [];
  for (const item of data) {
    if (item.type === 'dir') {
      const nested = await listMarkdownFiles(repo, token, item.path);
      files = files.concat(nested);
    } else if (item.type === 'file' && item.name.endsWith('.md')) {
      files.push(item.path);
    }
  }

  return files;
}

async function readMarkdownFile(repo, token, path) {
  const url = `https://api.github.com/repos/${repo}/contents/${encodeURIComponent(path).replace(/%2F/g, '/')}`;
  const data = await githubJson(url, token);
  return decodeGithubContent(data.content || '');
}

function buildBookDraftBundle(entries) {
  const generatedAt = new Date().toISOString();
  let out = '# Book Draft Bundle\n\n';
  out += `Generated at: ${generatedAt}\n\n`;
  out += `Total entries: ${entries.length}\n\n`;

  for (const entry of entries) {
    out += '---\n\n';
    out += `## ${entry.path}\n\n`;
    out += `${entry.content.trim()}\n\n`;
  }

  return out;
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ message: 'Method not allowed' });
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = process.env.GITHUB_REPO;
  const sessionToken = process.env.APP_SESSION_TOKEN || '6b058eb3c83227ef13fe652e79107e66b7d53c1153fe342f8e5260885b829bc7';

  if (!token || !repo) {
    return res.status(500).json({ message: 'Server missing GITHUB_TOKEN or GITHUB_REPO' });
  }

  const cookies = parseCookies(req.headers.cookie || '');
  if (cookies.app_session !== sessionToken) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  try {
    const paths = await listMarkdownFiles(repo, token, 'entries');
    const sortedPaths = paths.sort();

    const entries = [];
    for (const path of sortedPaths) {
      const content = await readMarkdownFile(repo, token, path);
      entries.push({ path, content });
    }

    const markdownBundle = buildBookDraftBundle(entries);

    const zip = new JSZip();
    zip.file('book-draft-bundle.md', markdownBundle);

    for (const entry of entries) {
      zip.file(entry.path, entry.content);
    }

    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
    const stamp = new Date().toISOString().slice(0, 10);
    const filename = `autobiography-entries-${stamp}.zip`;

    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    return res.status(200).send(zipBuffer);
  } catch (error) {
    return res.status(500).json({ message: error.message || 'Failed to export entries' });
  }
}
