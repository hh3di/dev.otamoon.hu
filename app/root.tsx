import {
  data,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useLocation,
  useNavigation,
  type LinksFunction,
  type LoaderFunction,
  type MetaFunction,
} from 'react-router';
import './app.css';
import { useEffect } from 'react';
import { ToastProvider } from './components/provider/Toast.Provider';
import { SocketProvider } from './components/provider/Socket.Provider';
import PagePreloader from './components/common/PagePreloader';
import { AnimatePresence, motion } from 'motion/react';
import Spinner from './components/common/Spinner';
import config from '../config';
import { CircleAlert } from 'lucide-react';
import { getLanguage } from './utils/service/language/server';
import { loadMessages } from './utils/service/language/loader';
import { popToast } from './utils/service/session.service';
import { AuthLoader } from './utils/service/auth.service';
import { LanguageProvider, useLanguage } from './utils/service/language/context';
import { blockUserInteraction } from './utils/service/function.service';

export const links: LinksFunction = () => [
  // 🔤 Fonts
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap',
  },

  // -----------------------------------------------------------------------------
  // Icons
  //
  // Place an `icon.png` file inside the `/public` directory.
  //
  // Recommended:
  // - PNG format
  // - Square image (1:1 aspect ratio)
  // - Minimum 512x512px
  // - 1024x1024px recommended for best quality
  // - Transparent background supported
  //
  // Generate all required web icons by running:
  //
  //   yarn assets
  //
  // This will create:
  // - favicon.ico
  // - favicon-16x16.png
  // - favicon-32x32.png
  // - apple-touch-icon.png
  //
  // These icons are used by browsers, bookmarks, tabs,
  // and iOS home screen shortcuts.
  // -----------------------------------------------------------------------------

  {
    rel: 'icon',
    href: '/icon/favicon.ico',
  },
  {
    rel: 'icon',
    type: 'image/png',
    sizes: '32x32',
    href: '/icon/favicon-32x32.png',
  },
  {
    rel: 'icon',
    type: 'image/png',
    sizes: '16x16',
    href: '/icon/favicon-16x16.png',
  },
  {
    rel: 'apple-touch-icon',
    href: '/icon/apple-touch-icon.png',
  },
];

export const meta: MetaFunction = () => {
  return [
    { title: config.TITLE },
    { name: 'description', content: config.TITLE },
    // 🔹 Robots
    { name: 'robots', content: 'index, follow' },
    // 🔹 Open Graph (Facebook, Discord, etc.)
    { property: 'og:title', content: config.TITLE },
    { property: 'og:description', content: config.TITLE },
    { property: 'og:type', content: 'website' },
    { property: 'og:image', content: '' },
    // 🔹 Twitter / X cards
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: config.TITLE },
    { name: 'twitter:description', content: config.TITLE },
    { name: 'twitter:image', content: '' },
  ];
};

export const loader: LoaderFunction = async ({ request, context }) => {
  const ctx = context as {
    root?: boolean;
  };
  ctx.root = false;
  const language = getLanguage(request);
  let messages;
  try {
    messages = await loadMessages(language);
  } catch (err) {
    console.error('Failed to load messages:', err);
    messages = {};
  }

  const { toastData, destroy } = await popToast(request);
  const response = await AuthLoader(request, [destroy]);

  const payload = {
    toastData,
    user: response.user || null,
    language,
    messages,
  };
  ctx.root = true;
  return response.headers ? data(payload, { headers: response.headers }) : data(payload);
};

export function Layout({ children }: { children: React.ReactNode }) {
  const { language, messages } = useLoaderData();
  return (
    <html lang={language}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body id="root">
        <SocketProvider>
          <LanguageProvider language={language} messages={messages}>
            <ToastProvider>{children}</ToastProvider>
          </LanguageProvider>
        </SocketProvider>

        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const navigation = useNavigation();
  const location = useLocation();
  const isRunning = navigation.state === 'loading' && navigation.formMethod == null && navigation.formAction == null;
  const isNavigationActive = navigation.state !== 'idle';
  useEffect(() => {
    const excludedPages = ['watch'];
    const shouldBlock = isNavigationActive && !excludedPages.some((page) => location.pathname.includes(page) || location.search.includes(page));
    const unblock = shouldBlock ? blockUserInteraction() : null;
    return () => unblock?.();
  }, [isNavigationActive, location.pathname, location.search]);
  return (
    <>
      <PagePreloader />
      <AnimatePresence>{isRunning && <Spinner animate fixed />}</AnimatePresence>
      <Outlet />
    </>
  );
}

const isDev = import.meta.env.DEV;
export function ErrorBoundary({ error }: { error: unknown }) {
  const { t } = useLanguage();
  const message = error instanceof Error ? error.message : 'Unexpected error';
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-slate-950 px-6">
      <div className="relative z-10 w-full max-w-md text-center">
        <div>
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ repeat: Infinity, duration: 5 }}
            className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-indigo-500/15 text-indigo-400"
          >
            <CircleAlert size={48} />
          </motion.div>

          <h1 className="mb-2 text-3xl font-bold text-slate-100">{t('error.boundary.title')}</h1>

          <p className="mb-6 text-sm text-slate-400">{t('error.boundary.headline')}</p>

          {isDev && (
            <div className="mb-6 rounded-xl border border-slate-800 bg-slate-950 p-4 text-left text-xs text-slate-400">
              <span className="text-red-400">Error:</span> {message}
            </div>
          )}

          {!isDev && (
            <div className="mb-6 rounded-xl border border-slate-800 bg-slate-900 p-4 text-sm text-slate-400">{t('error.boundary.description')}</div>
          )}

          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <a
              href="/"
              className="flex items-center justify-center gap-2 rounded-xl bg-indigo-500 px-5 py-3 font-medium text-white transition hover:bg-indigo-600 active:bg-indigo-600"
            >
              {t('error.boundary.button')}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
