import { createCookieSessionStorage, data, redirect } from 'react-router';

// FONTOS: soha ne használj VITE_ prefixet titkos kulcsokhoz — a Vite az ilyen
// nevű env változókat bebundleli a kliens oldali JS-be, tehát a böngészőben
// is olvashatóvá válna a session-aláíró kulcs.
const SECRET = process.env.SESSION_SECRET;
const isProd = process.env.NODE_ENV === 'production';

if (!SECRET) {
  // Ne engedjünk csendes fallbacket egy ismert, hardcode-olt stringre:
  // az production-ben komoly biztonsági kockázat lenne.
  throw new Error('SESSION_SECRET environment variable is not set. Define it on the server (do NOT prefix with VITE_).');
}

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
    // Nincs maxAge: szándékosan böngésző-session cookie,
    // mert a toast csak egyszeri megjelenítésre szolgál.
  },
});

const { getSession: getToastSession, commitSession: commitToastSession, destroySession: destroyToastSession } = toastStorage;

function isValidToast(value: unknown): value is Toast {
  return (
    typeof value === 'object' &&
    value !== null &&
    'type' in value &&
    ((value as Toast).type === 'success' || (value as Toast).type === 'error') &&
    typeof (value as Toast).message === 'string'
  );
}

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
  const rawToast = session.get('toast');
  const toast = isValidToast(rawToast) ? rawToast : null;

  return {
    toastData: toast,
    destroy: await destroyToastSession(session),
  };
}

export async function dataWithToast<T>(
  value: T,
  toast: Toast,
  options: {
    cookie?: string;
    status?: number;
  } = {},
) {
  const headers = await setToastHeaders(toast, options.cookie);
  return data(value, {
    status: options.status ?? 200,
    headers,
  });
}

function isAbsoluteUrl(url: string): boolean {
  return /^([a-z][a-z0-9+.-]*:)?\/\//i.test(url);
}

function normalizeRedirectPath(url: string): string {
  if (isAbsoluteUrl(url) || url.startsWith('/')) {
    return url;
  }
  return `/${url}`;
}

export async function redirectWithToast(url: string, toast: Toast, cookie?: string, status: 301 | 302 | 303 | 307 | 308 = 302) {
  const headers = await setToastHeaders(toast, cookie);
  return redirect(normalizeRedirectPath(url), { headers, status });
}
