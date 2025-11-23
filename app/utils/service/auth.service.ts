import { commitSession, destroySession, destroyTwoSession, getSession, getTwoSession } from './session.service';
import { GetRequest } from './api.service';
import cacheService from './cache.service';
import { memoryCache } from 'cache/cache.server';

// Local cache to avoid multiple requests within the same execution

// Helper function to get cached user data
async function getCachedUser(device_id: string, cacheType: 'local' | 'remote') {
  const cacheKey = `user:${device_id}`;

  // Get from remote/memory cache
  const cachedUser = cacheType === 'remote' ? await cacheService.get(cacheKey) : await memoryCache.get(cacheKey);
  return cachedUser;
}

/**
 * Authentikációs loader függvény
 * @param request - Bejövő kérés objektum
 * @param cookie - Opcionális cookie tömb
 */

export const AuthLoader = async (request: Request, cookie?: string[]) => {
  try {
    let cacheType: 'local' | 'remote' = 'remote';
    if (
      !process.env.CACHE_SERVICE_API_KEY ||
      process.env.CACHE_SERVICE_API_KEY === '' ||
      !process.env.CACHE_SERVICE_URL ||
      process.env.CACHE_SERVICE_URL === ''
    ) {
      cacheType = 'local';
    }

    const session = await getSession(request.headers.get('Cookie'));
    const cookieString = cookie ? cookie.join(', ') : '';
    const twofasession = await getTwoSession(request.headers.get('Cookie'));

    if (!session.has('device_id')) {
      return {
        user: null,
        headers: cookie ? { 'Set-Cookie': `${cookieString}, ${await destroyTwoSession(twofasession)}` } : undefined,
      };
    }

    const device_id = session.get('device_id');
    const cachedUser = await getCachedUser(device_id, cacheType);

    if (cachedUser) {
      return {
        user: {
          ...cachedUser.user,
          device_id,
        },
        headers: {
          'Set-Cookie': `${cookieString}, ${await commitSession(session)}`,
        },
      };
    }

    // Próbáljuk meg az access tokennel
    const userData = await getUser(session.get('access_token'));
    if (userData) {
      await updateUserCache(device_id, userData, session);
      return await createSuccessResponse(device_id, session, cookieString);
    }

    // Ha nem sikerült, próbáljuk meg a refresh tokennel
    const refreshTokenRes = await refreshToken(session.get('refresh_token'));
    if (!refreshTokenRes) {
      return await createFailureResponse(session, cookieString, twofasession);
    }
    const newUserData = await getUser(refreshTokenRes.access_token);
    if (!newUserData) {
      return await createFailureResponse(session, cookieString, twofasession);
    }

    // Frissítjük a session-t és a cache-t
    session.set('access_token', refreshTokenRes.access_token);
    session.set('refresh_token', refreshTokenRes.refresh_token);

    await updateUserCache(device_id, newUserData, session, refreshTokenRes);

    return await createSuccessResponse(device_id, session, cookieString);
  } catch (error) {
    return { user: null };
  }
};

/**
 * Cache frissítése felhasználói adatokkal
 */
async function updateUserCache(device_id: string, userData: any, session: any, tokenData?: { access_token: string; refresh_token: string }) {
  let cacheType: 'local' | 'remote' = 'remote';
  if (
    !process.env.CACHE_SERVICE_API_KEY ||
    process.env.CACHE_SERVICE_API_KEY === '' ||
    !process.env.CACHE_SERVICE_URL ||
    process.env.CACHE_SERVICE_URL === ''
  ) {
    cacheType = 'local';
  }
  const cacheData = {
    user: { ...userData.user },
    access_token: tokenData?.access_token || session.get('access_token'),
    refresh_token: tokenData?.refresh_token || session.get('refresh_token'),
    access_token_expires_in: userData.access_token_expires_in,
    device_id,
  };
  cacheType === 'remote' ? await cacheService.set(`user:${device_id}`, cacheData) : memoryCache.set(`user:${device_id}`, cacheData);
}

/**
 * Sikeres válasz objektum létrehozása
 */
async function createSuccessResponse(device_id: string, session: any, cookieString: string) {
  let cacheType: 'local' | 'remote' = 'remote';
  if (
    !process.env.CACHE_SERVICE_API_KEY ||
    process.env.CACHE_SERVICE_API_KEY === '' ||
    !process.env.CACHE_SERVICE_URL ||
    process.env.CACHE_SERVICE_URL === ''
  ) {
    cacheType = 'local';
  }

  const updatedUser = await getCachedUser(device_id, cacheType);

  return {
    user: {
      ...updatedUser?.user,
      device_id: updatedUser.device_id,
    },
    headers: {
      'Set-Cookie': `${cookieString}, ${await commitSession(session)}`,
    },
  };
}

/**
 * Sikertelen válasz objektum létrehozása
 */
async function createFailureResponse(session: any, cookieString: string, twofasession: any) {
  return {
    user: null,
    headers: {
      'Set-Cookie': `${cookieString}, ${await destroySession(session)}, ${await destroyTwoSession(twofasession)}`,
    },
  };
}

/**
 * Felhasználói adatok lekérése
 */
const getUser = async (access_token: string) => {
  try {
    const { data: res } = await GetRequest('/users/@me', access_token);
    return res;
  } catch (error) {
    return false;
  }
};

/**
 * Token frissítése
 */
const refreshToken = async (refresh_token: string) => {
  try {
    const { data: res } = await GetRequest('/auth/refresh', refresh_token);
    return res;
  } catch (error) {
    return false;
  }
};

/**
 * Token kezelő függvény, amely kezeli mind az access token, mind a refresh token folyamatokat
 * @param access_token - Érvényes access token
 * @param refresh_token - Érvényes refresh token
 * @param dev_id - Eszköz azonosító
 * @returns {Promise<object|false>} Sikeres esetben visszaadja az új token adatokat, hiba esetén false
 */
export const getToken = async (access_token: string, refresh_token: string, dev_id: string) => {
  try {
    let cacheType: 'local' | 'remote' = 'remote';
    if (
      !process.env.CACHE_SERVICE_API_KEY ||
      process.env.CACHE_SERVICE_API_KEY === '' ||
      !process.env.CACHE_SERVICE_URL ||
      process.env.CACHE_SERVICE_URL === ''
    ) {
      cacheType = 'local';
    }

    const cachedUser = await getCachedUser(dev_id, cacheType);
    if (cachedUser) {
      return {
        access_token: cachedUser.access_token,
        refresh_token: cachedUser.refresh_token,
        device_id: cachedUser.device_id,
      };
    }

    // Először megpróbáljuk az access tokennel
    const userData = await getUser(access_token);

    if (userData) {
      cacheType === 'remote'
        ? await cacheService.set(`user:${dev_id}`, {
            user: { ...userData.user },
            access_token,
            refresh_token,
            device_id: dev_id,
          })
        : await memoryCache.set(`user:${dev_id}`, {
            user: { ...userData.user },
            access_token,
            refresh_token,
            device_id: dev_id,
          });

      return {
        access_token,
        refresh_token,
        device_id: dev_id,
      };
    }

    // Ha az access token nem működik, próbáljuk a refresh tokennel
    const refreshTokenResult = await refreshToken(refresh_token);
    if (!refreshTokenResult) return false;

    const newUserData = await getUser(refreshTokenResult.access_token);
    if (!newUserData) return false;

    cacheType === 'remote'
      ? await cacheService.set(`user:${dev_id}`, {
          user: { ...newUserData.user },
          access_token: refreshTokenResult.access_token,
          refresh_token: refreshTokenResult.refresh_token,
          device_id: dev_id,
        })
      : await memoryCache.set(`user:${dev_id}`, {
          user: { ...newUserData.user },
          access_token: refreshTokenResult.access_token,
          refresh_token: refreshTokenResult.refresh_token,
          device_id: dev_id,
        });

    return {
      access_token: refreshTokenResult.access_token,
      refresh_token: refreshTokenResult.refresh_token,
      device_id: dev_id,
    };
  } catch (error) {
    return false;
  }
};
