import { AxiosError, AxiosRequestConfig } from 'axios';
import { BaseQueryFn } from '@reduxjs/toolkit/query/react';
import axios from 'axios';

const axiosInstance = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5555',
  withCredentials: true, // Important for httpOnly cookies
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
axiosInstance.interceptors.request.use(
  (config: AxiosRequestConfig) => {
    // Attach access token to Authorization header
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

// Response interceptor for token refresh
axiosInstance.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Get refreshToken from localStorage
        const refreshToken = typeof window !== 'undefined' ? localStorage.getItem('refreshToken') : null;
        
        if (!refreshToken || refreshToken === 'null' || refreshToken === 'undefined') {
          throw new Error('No valid refresh token available');
        }

        // Call refresh endpoint with refreshToken in request body
        const response = await axiosInstance.post('/api/v1/auth/refresh', { refreshToken });
        
        // Update tokens in localStorage
        if (typeof window !== 'undefined' && response.data?.data?.accessToken) {
          localStorage.setItem('accessToken', response.data.data.accessToken);
          localStorage.setItem('refreshToken', response.data.data.refreshToken);
        }

        // Retry the original request
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        // Refresh failed, clear tokens and redirect to login
        if (typeof window !== 'undefined') {
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
          window.location.href = '/login';
        }
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
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
      return { data: result.data };
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
