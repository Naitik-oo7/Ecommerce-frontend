import { removeCookie, setCookie } from './cookies';

const INVALID_TOKEN_VALUES = new Set(['null', 'undefined', '']);

const AUTH_NO_REFRESH_PATHS = [
  '/api/v1/auth/login',
  '/api/v1/auth/register',
  '/api/v1/auth/refresh',
  '/api/v1/auth/google',
  '/api/v1/auth/forgot-password',
  '/api/v1/auth/reset-password',
  '/api/v1/auth/verify-email',
] as const;

function isValidStoredToken(value: string | null): value is string {
  return !!value && !INVALID_TOKEN_VALUES.has(value);
}

export function getAccessToken(): string | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('accessToken') ?? sessionStorage.getItem('accessToken');
  return isValidStoredToken(token) ? token : null;
}

export function getRefreshToken(): string | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem('refreshToken') ?? sessionStorage.getItem('refreshToken');
  return isValidStoredToken(token) ? token : null;
}

export function isPersistedAuth(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    isValidStoredToken(localStorage.getItem('accessToken')) ||
    isValidStoredToken(localStorage.getItem('refreshToken'))
  );
}

export function shouldSkipTokenRefresh(url?: string): boolean {
  if (!url) return false;
  return AUTH_NO_REFRESH_PATHS.some((path) => url.includes(path));
}

export function setAuthTokens(accessToken: string, refreshToken: string, persist: boolean): void {
  if (typeof window === 'undefined') return;

  const storage = persist ? localStorage : sessionStorage;
  const other = persist ? sessionStorage : localStorage;

  storage.setItem('accessToken', accessToken);
  storage.setItem('refreshToken', refreshToken);
  other.removeItem('accessToken');
  other.removeItem('refreshToken');
  other.removeItem('user');

  if (persist) {
    setCookie('accessToken', accessToken, 60 * 60 * 24 * 7);
  } else {
    setCookie('accessToken', accessToken, 0);
  }
}

export function updateAuthTokens(accessToken: string, refreshToken?: string): void {
  if (typeof window === 'undefined') return;

  const persist = isPersistedAuth();
  const storage = persist ? localStorage : sessionStorage;
  storage.setItem('accessToken', accessToken);
  if (refreshToken) storage.setItem('refreshToken', refreshToken);

  if (persist) {
    setCookie('accessToken', accessToken, 60 * 60 * 24 * 7);
  } else {
    setCookie('accessToken', accessToken, 0);
  }
}

export function clearAuthTokens(): void {
  if (typeof window === 'undefined') return;

  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  sessionStorage.removeItem('accessToken');
  sessionStorage.removeItem('refreshToken');
  sessionStorage.removeItem('user');
  removeCookie('accessToken');
}
