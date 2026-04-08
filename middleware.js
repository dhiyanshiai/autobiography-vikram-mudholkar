function parseCookies(cookieHeader) {
  var out = {};
  if (!cookieHeader) return out;
  cookieHeader.split(';').forEach(function(part) {
    var i = part.indexOf('=');
    if (i > -1) {
      var key = part.slice(0, i).trim();
      var val = part.slice(i + 1).trim();
      out[key] = val;
    }
  });
  return out;
}

export function middleware(request) {
  const sessionToken = process.env.APP_SESSION_TOKEN || '6b058eb3c83227ef13fe652e79107e66b7d53c1153fe342f8e5260885b829bc7';
  const path = new URL(request.url).pathname;

  if (
    path === '/login' ||
    path === '/login.html' ||
    path === '/api/login' ||
    path === '/favicon.ico' ||
    path.startsWith('/_vercel')
  ) {
    return;
  }

  const cookies = parseCookies(request.headers.get('cookie') || '');
  const isAuthed = cookies.app_session === sessionToken;

  if (isAuthed) {
    return;
  }

  if (path.startsWith('/api/')) {
    return new Response(JSON.stringify({ message: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    });
  }

  return Response.redirect(new URL('/login.html', request.url), 302);
}

export const config = {
  matcher: ['/((?!_vercel|favicon.ico).*)']
};
