import { createCookieSessionStorage, data, redirect, type Session } from 'react-router';

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: 'u_sess_a8', //? Cookie name
    httpOnly: true, //? Only HTTP (XXS Protection)
    secure: process.env.NODE_ENV === 'production', //? Only on HTTPS (Production)
    secrets: [process.env.SESSION_SECRET || 'super-secret'], //? Secret key
    sameSite: 'lax', //? Cross Site request forgery
    path: '/', //? All route Allowed
    maxAge: 60 * 60 * 24 * 7, //? 1 week
    domain: process.env.NODE_ENV === 'production' ? process.env.SESSION_DOMAIN : undefined, //? Domain
  },
});

export async function getSession(cookieHeader: string | null) {
  return sessionStorage.getSession(cookieHeader);
}

export async function commitSession(session: Session) {
  return sessionStorage.commitSession(session);
}

export async function destroySession(session: Session) {
  return sessionStorage.destroySession(session);
}

const twoStorage = createCookieSessionStorage({
  cookie: {
    name: 'xid_01', //? Cookie name
    httpOnly: true, //? Only HTTP (XXS Protection)
    secure: process.env.NODE_ENV === 'production', //? Only on HTTPS (Production)
    secrets: [process.env.SESSION_SECRET || 'super-secret'], //? Secret key
    sameSite: 'lax', //? Cross Site request forgery
    path: '/', //? All route Allowed
    //maxAge: 60 * 60 * 24 * 7, //? 1 week
    domain: process.env.NODE_ENV === 'production' ? process.env.SESSION_DOMAIN : undefined, //? Domain
  },
});

export async function getTwoSession(cookieHeader: string | null) {
  return twoStorage.getSession(cookieHeader);
}

export async function commitTwoSession(session: Session) {
  return twoStorage.commitSession(session);
}

export async function destroyTwoSession(session: Session) {
  return twoStorage.destroySession(session);
}

const {
  getSession: getToastSession,
  commitSession: commitToastSession,
  destroySession: destroyToastSession,
} = createCookieSessionStorage({
  cookie: {
    name: 'zx_q9k_m7', //? Cookie name
    httpOnly: true, //? Only HTTP (XXS Protection)
    secure: process.env.NODE_ENV === 'production', //? Only on HTTPS (Production)
    secrets: [process.env.SESSION_SECRET || 'super-secret'], //? Secret key
    sameSite: 'lax', //? Cross Site request forgery
    path: '/', //? All route Allowed
    domain: process.env.NODE_ENV === 'production' ? process.env.SESSION_DOMAIN : undefined, //? Domain
  },
});

type Toast = {
  type: 'success' | 'error';
  message: string;
};

export async function popToast(request: Request) {
  const toastSession = await getToastSession(request.headers.get('Cookie'));
  const toastData = toastSession.get('toast') as Toast;
  return { toastData, destroySession: await destroyToastSession(toastSession) };
}

export async function dataWithToast(dataValue: any, toast: Toast, customCookie?: string) {
  const toastSession = await getToastSession();
  toastSession.set('toast', toast);

  const headers = new Headers();
  headers.append('Set-Cookie', await commitToastSession(toastSession));

  if (customCookie) {
    headers.append('Set-Cookie', customCookie);
  }

  return data(dataValue, { headers });
}

export async function redirectWithToast(url: string, toast: Toast, customCookie?: string) {
  const toastSession = await getToastSession();
  toastSession.set('toast', toast);

  const headers = new Headers();
  headers.append('Set-Cookie', await commitToastSession(toastSession));

  if (customCookie) {
    headers.append('Set-Cookie', customCookie);
  }

  return redirect(url.startsWith('/') ? url : `/${url}`, { headers });
}
