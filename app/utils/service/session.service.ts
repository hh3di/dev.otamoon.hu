import { createCookieSessionStorage, data, redirect } from 'react-router';

const SECRET = import.meta.env.VITE_SESSION_SECRET || 'super-secret';

const isProd = process.env.NODE_ENV === 'production';

/* ---------------- SESSION STORAGE ---------------- */

const sessionStorage = createCookieSessionStorage({
  cookie: {
    name: 'u_sess_a8',
    httpOnly: true,
    secure: isProd,
    secrets: [SECRET],
    sameSite: 'lax',
    path: '/',
    maxAge: 60 * 60 * 24 * 7,
  },
});

export const getSession = sessionStorage.getSession;

export const commitSession = sessionStorage.commitSession;

export const destroySession = sessionStorage.destroySession;

export type Toast = {
  type: 'success' | 'error';
  message: string;
};

const toastStorage = createCookieSessionStorage({
  cookie: {
    name: 'zx_q9k_m7',
    httpOnly: true,
    secure: isProd,
    secrets: [SECRET],
    sameSite: 'lax',
    path: '/',
  },
});

const { getSession: getToastSession, commitSession: commitToastSession, destroySession: destroyToastSession } = toastStorage;

async function setToastHeaders(toast: Toast, extraCookie?: string) {
  const session = await getToastSession();

  session.set('toast', toast);

  const headers = new Headers();

  headers.append('Set-Cookie', await commitToastSession(session));

  if (extraCookie) {
    headers.append('Set-Cookie', extraCookie);
  }

  return headers;
}

export async function popToast(request: Request) {
  const session = await getToastSession(request.headers.get('Cookie'));

  const toast = session.get('toast') as Toast;

  return {
    toastData: toast || null,
    destroy: await destroyToastSession(session),
  };
}

export async function dataWithToast<T>(value: T, toast: Toast, cookie?: string) {
  const headers = await setToastHeaders(toast, cookie);

  return data(value, { headers });
}

export async function redirectWithToast(url: string, toast: Toast, cookie?: string) {
  const headers = await setToastHeaders(toast, cookie);

  return redirect(url.startsWith('/') ? url : `/${url}`, { headers });
}
