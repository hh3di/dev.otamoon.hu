import { api } from './api.service';
import redisService from './redis.service';
import { commitSession, destroySession, getSession } from './session.service';

const getCacheKey = (id: string) => `user:${id}`;

async function getCachedUser(id: string) {
  return redisService.get(getCacheKey(id));
}

async function setCachedUser(
  id: string,
  data: {
    user: any;
    access_token: string;
    refresh_token: string;
    device_id: string;
  },
) {
  return redisService.set(getCacheKey(id), data, 30);
}

const getUser = async (token: string) => {
  try {
    const { data } = await api.get('/users/@me', token);

    if (!data?.user) {
      return null;
    }

    return data;
  } catch {
    return null;
  }
};

const refreshToken = async (token: string) => {
  try {
    const { data } = await api.get('/auth/refresh', token);
    return data;
  } catch {
    return null;
  }
};

export const AuthLoader = async (request: Request, cookie?: string[]) => {
  try {
    const session = await getSession(request.headers.get('Cookie'));

    const headers = new Headers();

    if (cookie?.length) {
      headers.set('Set-Cookie', cookie.join(', '));
    }

    const device_id = session.get('device_id');

    if (!device_id) {
      headers.append('Set-Cookie', await destroySession(session));

      return {
        user: null,
        headers,
      };
    }

    const cached = await getCachedUser(device_id);

    if (cached && cached.user && typeof cached.user === 'object') {
      headers.append('Set-Cookie', await commitSession(session));

      return {
        user: {
          ...cached.user,
          device_id,
        },
        headers,
      };
    }

    const access = session.get('access_token');
    const refresh = session.get('refresh_token');

    let userResponse = access ? await getUser(access) : null;

    let tokens = null;

    if (!userResponse && refresh) {
      tokens = await refreshToken(refresh);

      if (tokens?.access_token) {
        userResponse = await getUser(tokens.access_token);

        if (userResponse) {
          session.set('access_token', tokens.access_token);

          session.set('refresh_token', tokens.refresh_token);
        }
      }
    }

    if (!userResponse?.user) {
      headers.append('Set-Cookie', await destroySession(session));

      return {
        user: null,
        headers,
      };
    }

    await setCachedUser(device_id, {
      user: userResponse.user,
      access_token: tokens?.access_token ?? access,
      refresh_token: tokens?.refresh_token ?? refresh,
      device_id,
    });

    headers.append('Set-Cookie', await commitSession(session));

    return {
      user: {
        ...userResponse.user,
        device_id,
      },
      headers,
    };
  } catch (error) {
    console.error('AuthLoader:', error);

    return {
      user: null,
      headers: new Headers(),
    };
  }
};

export const getToken = async (access_token: string, refresh_token: string, dev_id: string) => {
  try {
    const cached = await getCachedUser(dev_id);

    if (cached && cached.user && typeof cached.user === 'object') {
      return {
        user: cached.user,
        access_token: cached.access_token,
        refresh_token: cached.refresh_token,
        device_id: cached.device_id,
      };
    }

    const userResponse = await getUser(access_token);

    if (userResponse?.user) {
      await setCachedUser(dev_id, {
        user: userResponse.user,
        access_token,
        refresh_token,
        device_id: dev_id,
      });

      return {
        user: userResponse.user,
        access_token,
        refresh_token,
        device_id: dev_id,
      };
    }

    const refreshed = await refreshToken(refresh_token);

    if (!refreshed?.access_token) {
      return false;
    }

    const newUser = await getUser(refreshed.access_token);

    if (!newUser?.user) {
      return false;
    }

    await setCachedUser(dev_id, {
      user: newUser.user,
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
      device_id: dev_id,
    });

    return {
      user: newUser.user,
      access_token: refreshed.access_token,
      refresh_token: refreshed.refresh_token,
      device_id: dev_id,
    };
  } catch (error) {
    console.error('getToken:', error);
    return false;
  }
};
