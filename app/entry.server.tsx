import { PassThrough } from 'node:stream';
import type { AppLoadContext, EntryContext } from 'react-router';
import { createReadableStreamFromReadable } from '@react-router/node';
import { ServerRouter } from 'react-router';
import { isbot } from 'isbot';
import type { RenderToPipeableStreamOptions } from 'react-dom/server';
import { renderToPipeableStream } from 'react-dom/server';
import i18n, { getLanguage } from './utils/i18n/i18n';
import { createInstance } from 'i18next';
import { I18nextProvider, initReactI18next } from 'react-i18next';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

export const streamTimeout = 5_000;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  routerContext: EntryContext,
  loadContext: AppLoadContext,
  // If you have middleware enabled:
  // loadContext: unstable_RouterContextProvider
) {
  return new Promise(async (resolve, reject) => {
    const { locale, localeCookie } = getLanguage(request);
    const lng = locale;

    // Set the locale cookie if needed
    if (localeCookie) {
      responseHeaders.set('Set-Cookie', localeCookie);
    }

    let instance = createInstance();

    // Load translations directly from filesystem
    const translationPath = join(process.cwd(), 'public', 'locales', `${lng}.json`);
    let translations = {};
    try {
      const translationContent = readFileSync(translationPath, 'utf8');
      translations = JSON.parse(translationContent);
    } catch (error) {
      console.warn(`Could not load translations for ${lng}:`, error);
      // Fallback to English if available
      if (lng !== i18n.fallbackLng) {
        const fallbackPath = join(process.cwd(), 'public', 'locales', `${i18n.fallbackLng}.json`);
        try {
          const fallbackContent = readFileSync(fallbackPath, 'utf8');
          translations = JSON.parse(fallbackContent);
        } catch (fallbackError) {
          console.warn(`Could not load fallback translations:`, fallbackError);
        }
      }
    }

    await instance.use(initReactI18next).init({
      ...i18n,
      lng,
      resources: {
        [lng]: {
          translation: translations,
        },
      },
      interpolation: {
        escapeValue: false,
      },
      react: {
        useSuspense: false,
      },
    });
    let shellRendered = false;
    let userAgent = request.headers.get('user-agent');

    // Ensure requests from bots and SPA Mode renders wait for all content to load before responding
    // https://react.dev/reference/react-dom/server/renderToPipeableStream#waiting-for-all-content-to-load-for-crawlers-and-static-generation
    let readyOption: keyof RenderToPipeableStreamOptions = (userAgent && isbot(userAgent)) || routerContext.isSpaMode ? 'onAllReady' : 'onShellReady';

    const { pipe, abort } = renderToPipeableStream(
      <I18nextProvider i18n={instance}>
        <ServerRouter context={routerContext} url={request.url} />
      </I18nextProvider>,
      {
        [readyOption]() {
          shellRendered = true;
          const body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);

          responseHeaders.set('Content-Type', 'text/html');

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: responseStatusCode,
            }),
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          responseStatusCode = 500;
          // Log streaming rendering errors from inside the shell.  Don't log
          // errors encountered during initial shell rendering since they'll
          // reject and get logged in handleDocumentRequest.
          if (shellRendered) {
            console.error(error);
          }
        },
      },
    );

    // Abort the rendering stream after the `streamTimeout` so it has time to
    // flush down the rejected boundaries
    setTimeout(abort, streamTimeout + 1000);
  });
}
