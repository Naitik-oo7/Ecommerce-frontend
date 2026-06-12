'use client';

import { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import axiosInstance from '@/lib/axiosBaseQuery';

interface ConnectionContextType {
  isConnecting: boolean;
  setIsConnecting: (value: boolean) => void;
  connectionError: string | null;
  setConnectionError: (error: string | null) => void;
}

const ConnectionContext = createContext<ConnectionContextType | undefined>(undefined);

export function ConnectionProvider({ children }: { children: ReactNode }) {
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionError, setConnectionError] = useState<string | null>(null);

  useEffect(() => {
    let requestCount = 0;

    const requestInterceptor = axiosInstance.interceptors.request.use((config) => {
      if (requestCount === 0) {
        setIsConnecting(true);
        setConnectionError(null);
      }
      requestCount++;
      return config;
    });

    const responseInterceptor = axiosInstance.interceptors.response.use(
      (response) => {
        requestCount--;
        if (requestCount === 0) {
          setIsConnecting(false);
        }
        return response;
      },
      (error) => {
        requestCount--;
        if (requestCount === 0) {
          setIsConnecting(false);
        }

        if (error.code === 'ECONNREFUSED' || error.code === 'ECONNABORTED') {
          setConnectionError('Backend is waking up... Please wait.');
        } else if (error.response?.status === 503) {
          setConnectionError('Backend is starting... Please wait.');
        }

        return Promise.reject(error);
      }
    );

    return () => {
      axiosInstance.interceptors.request.eject(requestInterceptor);
      axiosInstance.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  return (
    <ConnectionContext.Provider value={{ isConnecting, setIsConnecting, connectionError, setConnectionError }}>
      {children}
    </ConnectionContext.Provider>
  );
}

export function useConnection() {
  const context = useContext(ConnectionContext);
  if (!context) {
    throw new Error('useConnection must be used within ConnectionProvider');
  }
  return context;
}
