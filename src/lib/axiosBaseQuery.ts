import { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { BaseQueryFn } from '@reduxjs/toolkit/query/react';
import axios from 'axios';
import {
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  shouldSkipTokenRefresh,
  updateAuthTokens,
} from './authTokens';

// SECURITY WARNING (Issue #10): Tokens are stored in localStorage and sent via Authorization header.
// localStorage is accessible to all JavaScript on the page, making tokens vulnerable to XSS attacks.
// withCredentials is kept for CORS credentialed requests (non-auth cookies, CSRF).
// RECOMMENDED: Switch to HttpOnly cookies set by backend on login. The backend already supports
// withCredentials: true. Remove localStorage interceptors below and use cookie-based auth only.
const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5555',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Token refresh state management to prevent race conditions
let isRefreshing = false;
let refreshSubscribers: Array<{ onSuccess: (token: string) => void; onError: (error: unknown) => void }> = [];

function subscribeTokenRefresh(
  onSuccess: (token: string) => void,
  onError: (error: unknown) => void
) {
  refreshSubscribers.push({ onSuccess, onError });
}

function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach((subscriber) => subscriber.onSuccess(newToken));
  refreshSubscribers = [];
}

function onRefreshFailed(error: unknown) {
  refreshSubscribers.forEach((subscriber) => subscriber.onError(error));
  refreshSubscribers = [];
}

axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAccessToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => Promise.reject(error)
);

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean; _retryCount?: number };
    const requestUrl = originalRequest?.url ?? '';

    // Handle cold start (connection timeout/503) with exponential backoff retry
    if (
      originalRequest &&
      !originalRequest._retry &&
      (error.code === 'ECONNABORTED' || error.code === 'ECONNREFUSED' || error.response?.status === 503)
    ) {
      originalRequest._retry = true;
      originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

      if (originalRequest._retryCount <= 3) {
        const delay = Math.min(1000 * Math.pow(2, originalRequest._retryCount - 1), 5000);
        await new Promise((resolve) => setTimeout(resolve, delay));
        return axiosInstance(originalRequest);
      }
    }

    if (
      error.response?.status !== 401 ||
      !originalRequest ||
      originalRequest._retry ||
      shouldSkipTokenRefresh(requestUrl)
    ) {
      return Promise.reject(error);
    }

    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh(
          (newToken: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            resolve(axiosInstance(originalRequest));
          },
          (refreshError: unknown) => {
            reject(refreshError);
          }
        );
      });
    }

    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = getRefreshToken();
      if (!refreshToken) {
        throw new Error('No valid refresh token available');
      }

      const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5555';
      const response = await axios.post(`${baseURL}/api/v1/auth/refresh`, { refreshToken });

      const responseData = response.data?.data ?? response.data;
      const newAccessToken = responseData?.accessToken;
      const newRefreshToken = responseData?.refreshToken;

      if (!newAccessToken) {
        throw new Error('No access token received from refresh endpoint');
      }

      updateAuthTokens(newAccessToken, newRefreshToken);

      if (responseData?.user?.id) {
        const { store } = await import('./redux/store');
        const { setUser } = await import('./redux/authSlice');
        store.dispatch(setUser(responseData.user));
      }

      onTokenRefreshed(newAccessToken);

      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      }
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      onRefreshFailed(refreshError);
      clearAuthTokens();
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

export function axiosBaseQuery(): BaseQueryFn<{
  url: string;
  method?: AxiosRequestConfig['method'];
  data?: AxiosRequestConfig['data'];
  params?: AxiosRequestConfig['params'];
  headers?: AxiosRequestConfig['headers'];
}> {
  return async ({ url, method = 'GET', data, params, headers }) => {
    try {
      const result = await axiosInstance({
        url,
        method,
        data,
        params,
        headers,
      });
      const responseData = result.data?.data ?? result.data;
      const metadata = result.data?.metadata;

      if (metadata && Array.isArray(responseData)) {
        return { data: { data: responseData, ...metadata } };
      }

      return { data: responseData };
    } catch (axiosError) {
      const err = axiosError as AxiosError;
      return {
        error: {
          status: err.response?.status,
          data: err.response?.data || err.message,
        },
      };
    }
  };
}

export default axiosInstance;
