import {
  data,
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
  useNavigation,
  type LinksFunction,
  type LoaderFunction,
  type MetaFunction,
} from 'react-router';
import './app.css';
import { setMeta } from './utils/service/meta.service';
import { isbot } from 'isbot';
import { getLanguage } from './utils/i18n/i18n';
import { popToast } from './utils/service/session.service';
import { AuthLoader } from './utils/service/auth.service';
import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { ToastProvider } from './components/provider/Toast.Provider';
import { AnimatePresence } from 'motion/react';
import Spinner from './components/common/Spinner';
import { LuTriangleAlert } from 'react-icons/lu';
import createI18nInstance from './utils/i18n/i18next.server';

export const links: LinksFunction = () => [
  // Preconnect for performance
  { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
  {
    rel: 'preconnect',
    href: 'https://fonts.gstatic.com',
    crossOrigin: 'anonymous',
  },
  {
    rel: 'stylesheet',
    href: 'https://fonts.googleapis.com/css2?family=Inter:ital,opsz,wght@0,14..32,100..900;1,14..32,100..900&display=swap',
  },

  // DNS prefetch for better performance
  { rel: 'dns-prefetch', href: 'https://fonts.googleapis.com' },
  { rel: 'dns-prefetch', href: 'https://fonts.gstatic.com' },

  // Favicon and touch icons
  { rel: 'icon', type: 'image/png', href: '/favicon-96x96.png', sizes: '96x96' },
  { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
  { rel: 'icon', type: 'shortcut icon', href: '/favicon.ico' },
  { rel: 'icon', type: 'apple-touch-icon', sizes: '180x180', href: '/apple-touch-icon.png' },
  { rel: 'manifest', href: '/site.webmanifest' },
];

export const meta: MetaFunction = ({ matches }) => {
  const rootData = matches.find((m) => m.id === 'root')?.data as {
    locale: string;
    metaTexts: {
      title: string;
      description: string;
      keywords: string;
      ogTitle: string;
      ogDescription: string;
      aiSummary: string;
    };
  };

  const t = (key: keyof typeof rootData.metaTexts) => rootData.metaTexts[key];

  const metaTags = [
    { name: 'title', content: t('title') },
    { name: 'description', content: t('description') },
    { name: 'keywords', content: t('keywords') },
    { name: 'author', content: 'Szegedi Dani' },
    { name: 'robots', content: 'index, follow, max-snippet:-1, max-image-preview:large' },
    { rel: 'canonical', href: 'https://dev.otamoon.hu' },
    { property: 'og:title', content: t('ogTitle') },
    { property: 'og:description', content: t('ogDescription') },
    { property: 'og:type', content: 'website' },
    { property: 'og:locale', content: rootData.locale === 'hu' ? 'hu_HU' : 'en_US' },
    { property: 'og:url', content: 'https://dev.otamoon.hu' },
    { property: 'og:image', content: 'https://dev.otamoon.hu/og-image.png' },
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:title', content: t('ogTitle') },
    { name: 'twitter:description', content: t('ogDescription') },
    { name: 'ai-summary', content: t('aiSummary') },
    { name: 'ai-keywords', content: t('keywords') },
    { name: 'ai-language', content: rootData.locale },
    { itemProp: 'name', content: t('title') },
    { itemProp: 'description', content: t('description') },
  ];

  return setMeta(matches, metaTags);
};

export const loader: LoaderFunction = async ({ request, context }) => {
  context.root = false;
  const userAgent = request.headers.get('user-agent') || '';
  const botDetected = isbot(userAgent);
  const { locale, localeCookie } = getLanguage(request);
  const { toastData, destroySession } = await popToast(request);
  const response = await AuthLoader(request, [destroySession, localeCookie]);

  const { t } = await createI18nInstance(locale);
  const metaTexts = {
    title: t('meta.title'),
    description: t('meta.description'),
    keywords: t('meta.keywords'),
    ogTitle: t('meta.ogTitle'),
    ogDescription: t('meta.ogDescription'),
    aiSummary: t('meta.aiSummary'),
  };

  const dataObj = {
    toastData,
    isbot: botDetected,
    locale,
    user: response.user || null,
    metaTexts,
  };

  if (response.headers) {
    context.root = true;
    return data(dataObj, { headers: response.headers });
  } else {
    context.root = true;
    return data(dataObj);
  }
};

export function Layout({ children }: { children: React.ReactNode }) {
  const { locale } = useLoaderData<{ locale: string; isProduction: boolean }>();
  const { i18n } = useTranslation();
  useEffect(() => {
    if (i18n.language !== locale) {
      i18n.changeLanguage(locale);
    }
  }, [locale, i18n]);
  return (
    <html lang={locale} dir={i18n.dir()}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta httpEquiv="X-UA-Compatible" content="IE=edge" />
        <Meta />
        <Links />
      </head>
      <body id="root">
        <ToastProvider>{children}</ToastProvider>
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  const navigation = useNavigation();
  const isRunning = navigation.state === 'loading' && navigation.formMethod == null && navigation.formAction == null;
  return (
    <>
      <AnimatePresence>{isRunning && <Spinner fixed />}</AnimatePresence>
      <Outlet />
    </>
  );
}
export function ErrorBoundary({ error }: any) {
  const { t } = useTranslation();
  let title = t('errors.default.title');
  let message = t('errors.default.message');
  let suggestion = t('errors.default.suggestion');
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    if (error.status === 404) {
      title = t('errors.not_found.title');
      message = t('errors.not_found.message');
      suggestion = t('errors.not_found.suggestion');
    } else {
      title = t('errors.server_unavailable.title');
      message = error.statusText || t('errors.server_unavailable.message');
      suggestion = t('errors.server_unavailable.suggestion');
    }
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    message = error.message;
    stack = error.stack;
  }

  return (
    <>
      <section className="relative flex flex-col justify-center py-8 px-4 sm:px-6 lg:px-8 overflow-hidden">
        <div className="w-full flex flex-col items-center text-center relative z-10 space-y-6 sm:space-y-8">
          {/* Error Icon with glow effect */}
          <div className="relative group">
            <div className="absolute inset-0 bg-linear-to-r from-rose-400/20 to-red-400/20 rounded-full blur-xl group-hover:from-rose-400/30 group-hover:to-red-400/30 transition-all duration-500"></div>
            <div className="relative flex items-center justify-center w-24 h-24 sm:w-28 sm:h-28 md:w-32 md:h-32 rounded-full bg-linear-to-br from-rose-500/20 to-red-500/20 backdrop-blur-sm border border-rose-500/30 transition-all duration-500 group-hover:scale-110">
              <LuTriangleAlert className="w-12 h-12 sm:w-14 sm:h-14 md:w-16 md:h-16 text-rose-400 transition-transform duration-500 group-hover:scale-110" />
            </div>
          </div>

          {/* Error Title */}
          <div className="space-y-2">
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black leading-none text-white uppercase tracking-tight">{title}</h1>
            <div className="w-16 sm:w-24 md:w-32 h-1 bg-linear-to-r from-rose-400 via-red-300 to-rose-500 mx-auto rounded-full"></div>
          </div>

          {/* Error Message */}
          <p className="text-lg sm:text-xl md:text-2xl text-transparent bg-linear-to-r from-rose-200 via-red-200 to-rose-300 bg-clip-text font-bold max-w-2xl mx-auto">
            {message}
          </p>

          {/* Error Suggestion */}
          <p className="text-sm sm:text-base md:text-lg text-rose-200/90 max-w-xl sm:max-w-2xl mx-auto leading-relaxed font-light">{suggestion}</p>

          {/* Development Stack Trace */}
          {stack && import.meta.env.DEV && (
            <div className="w-full max-w-4xl mx-auto mt-8">
              <details className="bg-black/50 backdrop-blur-sm border border-rose-500/30 rounded-lg p-4">
                <summary className="text-rose-300 font-medium cursor-pointer hover:text-rose-200 transition-colors">
                  🐛 Development Stack Trace (csak dev módban)
                </summary>
                <pre className="mt-4 text-xs sm:text-sm text-rose-100/80 overflow-x-auto whitespace-pre-wrap font-mono">
                  <code>{stack}</code>
                </pre>
              </details>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-2 pt-4 sm:pt-5 md:pt-7">
            {/* Primary Action Button */}
            <button
              onClick={() => (window.location.href = '/')}
              className="group relative overflow-hidden bg-linear-to-r from-rose-500 via-red-500 to-rose-500 hover:from-rose-500 hover:via-red-500 hover:to-rose-500 px-6 py-3 rounded-lg text-base sm:text-lg font-bold transition-all duration-500 transform hover:scale-105 hover:shadow-2xl hover:shadow-rose-500/30 flex items-center justify-center gap-3"
            >
              <div className="absolute inset-0 bg-white/20 translate-x-[-102%] group-hover:translate-x-[102%] transition-transform duration-700 skew-x-12"></div>
              <span className="relative z-10">{t('errors.default.buttonText')}</span>
            </button>
          </div>
        </div>
      </section>
    </>
  );
}
