import { NextResponse } from 'next/server';

function unauthorized() {
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure App", charset="UTF-8"'
    }
  });
}

export function middleware(request) {
  const expectedUser = process.env.BASIC_AUTH_USERNAME;
  const expectedPass = process.env.BASIC_AUTH_PASSWORD;

  if (!expectedUser || !expectedPass) {
    return new NextResponse('Server auth is not configured', { status: 500 });
  }

  const auth = request.headers.get('authorization') || '';
  if (!auth.startsWith('Basic ')) {
    return unauthorized();
  }

  let decoded = '';
  try {
    decoded = atob(auth.slice(6));
  } catch (_) {
    return unauthorized();
  }

  const sep = decoded.indexOf(':');
  if (sep < 0) {
    return unauthorized();
  }

  const user = decoded.slice(0, sep);
  const pass = decoded.slice(sep + 1);

  if (user !== expectedUser || pass !== expectedPass) {
    return unauthorized();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_vercel|favicon.ico).*)']
};
