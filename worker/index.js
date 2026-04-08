// Cloudflare Worker - GitHub proxy for autobiography app
//
// Environment secrets (set in Cloudflare dashboard):
//   GITHUB_TOKEN  — your fine-grained PAT with Contents: read/write
//   GITHUB_REPO   - "owner/repo-name"
//   ALLOWED_ORIGIN - "https://<username>.github.io"

function cors(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400'
  };
}

async function handleRequest(request, env) {
  var origin = request.headers.get('Origin') || '';
  var allowedOrigin = env.ALLOWED_ORIGIN || '';

  // Preflight
  if (request.method === 'OPTIONS') {
    if (!allowedOrigin || origin !== allowedOrigin) {
      return new Response('Origin not allowed', { status: 403 });
    }
    return new Response(null, { status: 204, headers: cors(origin) });
  }

  // Only allow POST from the app
  if (request.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 });
  }
  if (!allowedOrigin || origin !== allowedOrigin) {
    return new Response('Origin not allowed', { status: 403 });
  }

  // Parse body
  var body;
  try {
    body = await request.json();
  } catch (e) {
    return new Response('Invalid JSON', { status: 400, headers: cors(origin) });
  }

  var path    = body.path;
  var message = body.message;
  var content = body.content;

  if (!path || !message || !content) {
    return new Response('Missing fields: path, message, content', {
      status: 400,
      headers: cors(origin)
    });
  }

  // Use token + repo from Worker environment secrets
  var token = env.GITHUB_TOKEN;
  var repo  = env.GITHUB_REPO;

  if (!token || !repo) {
    return new Response('Worker missing GITHUB_TOKEN or GITHUB_REPO secret', {
      status: 500,
      headers: cors(origin)
    });
  }

  var githubUrl = 'https://api.github.com/repos/' + repo + '/contents/' + path;

  var githubRes = await fetch(githubUrl, {
    method: 'PUT',
    headers: {
      'Authorization': 'Bearer ' + token,
      'Content-Type':  'application/json',
      'User-Agent':    'autobiography-template-worker'
    },
    body: JSON.stringify({ message: message, content: content })
  });

  var data = await githubRes.text();

  return new Response(data, {
    status: githubRes.status,
    headers: Object.assign({ 'Content-Type': 'application/json' }, cors(origin))
  });
}

export default {
  fetch: handleRequest
};
