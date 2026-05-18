'use client';

import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/lib/redux/store';
import { setUser, clearUser, setLoading } from '@/lib/redux/authSlice';
import axiosInstance from '@/lib/axiosBaseQuery';

function AuthInitializer({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      store.dispatch(clearUser());
      return;
    }
    store.dispatch(setLoading(true));
    axiosInstance
      .get('/api/v1/users/me')
      .then((res) => {
        const user = res.data?.data || res.data;
        if (user?.id) {
          store.dispatch(setUser(user));
        } else {
          store.dispatch(clearUser());
        }
      })
      .catch(() => {
        store.dispatch(clearUser());
      });
  }, []);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthInitializer>{children}</AuthInitializer>
    </Provider>
  );
}
