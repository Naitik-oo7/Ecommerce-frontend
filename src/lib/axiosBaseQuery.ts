import { AxiosError, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { BaseQueryFn } from '@reduxjs/toolkit/query/react';
import axios from 'axios';

// Auth model: tokens are stored in localStorage and sent via the Authorization header.
// withCredentials is kept for CORS credentialed requests (non-auth cookies, CSRF).
// To switch to httpOnly cookies, remove the localStorage interceptors below and
// have the backend set Set-Cookie on login — the frontend would then send no header.
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

// Subscribe to token refresh
function subscribeTokenRefresh(
  onSuccess: (token: string) => void,
  onError: (error: unknown) => void
) {
  refreshSubscribers.push({ onSuccess, onError });
}

// Notify all subscribers with new token
function onTokenRefreshed(newToken: string) {
  refreshSubscribers.forEach((subscriber) => subscriber.onSuccess(newToken));
  refreshSubscribers = [];
}

// Notify all subscribers of refresh failure
function onRefreshFailed(error: unknown) {
  refreshSubscribers.forEach((subscriber) => subscriber.onError(error));
  refreshSubscribers = [];
}

// Request interceptor
axiosInstance.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('accessToken') : null;
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor for token refresh with queue mechanism
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };

    // If error is not 401 or request already retried, reject immediately
    if (error.response?.status !== 401 || !originalRequest) {
      return Promise.reject(error);
    }

    // If already refreshing, queue this request
    if (isRefreshing) {
      return new Promise((resolve, reject) => {
        subscribeTokenRefresh(
          (newToken: string) => {
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${newToken}`;
            }
            resolve(axiosInstance(originalRequest));
          },
          (error: unknown) => {
            reject(error);
          }
        );
      });
    }

    // Mark as retrying to prevent loops
    originalRequest._retry = true;
    isRefreshing = true;

    try {
      const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;

      if (!refreshToken || refreshToken === 'null' || refreshToken === 'undefined') {
        throw new Error('No valid refresh token available');
      }

      // Call refresh endpoint - use a fresh axios instance to avoid interceptor loops
      const baseURL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5555';
      const response = await axios.post(`${baseURL}/api/v1/auth/refresh`, { refreshToken });

      const responseData = response.data?.data ?? response.data;
      const newAccessToken = responseData?.accessToken;
      const newRefreshToken = responseData?.refreshToken;

      if (!newAccessToken) {
        throw new Error('No access token received from refresh endpoint');
      }

      // Store new tokens
      if (typeof window !== 'undefined') {
        localStorage.setItem('accessToken', newAccessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }
      }

      // Notify all queued requests
      onTokenRefreshed(newAccessToken);

      // Retry original request with new token
      if (originalRequest.headers) {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      }
      return axiosInstance(originalRequest);
    } catch (refreshError) {
      // Notify all queued requests that refresh failed
      onRefreshFailed(refreshError);

      // Refresh failed - clear tokens and redirect
      if (typeof window !== 'undefined') {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
      }
      return Promise.reject(refreshError);
    } finally {
      isRefreshing = false;
    }
  }
);

// axiosBaseQuery for RTK Query
export const axiosBaseQuery =
  (): BaseQueryFn<{
    url: string;
    method?: AxiosRequestConfig['method'];
    data?: AxiosRequestConfig['data'];
    params?: AxiosRequestConfig['params'];
    headers?: AxiosRequestConfig['headers'];
  }> =>
  async ({ url, method = 'GET', data, params, headers }) => {
    try {
      const result = await axiosInstance({
        url,
        method,
        data,
        params,
        headers,
      });
      // Backend returns { status, message, data, metadata? }
      // Return data directly for simple responses, or with metadata for paginated lists
      const responseData = result.data?.data ?? result.data;
      const metadata = result.data?.metadata;

      // If metadata exists (for paginated responses), merge it into the returned data
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

export default axiosInstance;
