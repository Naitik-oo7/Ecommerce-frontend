'use client';

import { useEffect, useRef } from 'react';
import { Provider } from 'react-redux';
import { store } from '@/lib/redux/store';
import { setUser, clearUser, setLoading } from '@/lib/redux/authSlice';
import axiosInstance from '@/lib/axiosBaseQuery';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

// Smooth scroll provider with Lenis
function SmoothScrollProvider({ children }: { children: React.ReactNode }) {
  const lenisRef = useRef<Lenis | null>(null);

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    lenisRef.current = lenis;

    lenis.on('scroll', ScrollTrigger.update);

    // Hoist to a stable reference so gsap.ticker.remove() matches the same function
    const ticker = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(ticker);
    gsap.ticker.lagSmoothing(0);

    if (process.env.NODE_ENV === 'development') {
      (window as typeof window & { lenis: Lenis }).lenis = lenis;
    }

    return () => {
      gsap.ticker.remove(ticker);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const hasInitialized = useRef(false);

  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    const token = localStorage.getItem('accessToken');
    if (!token) {
      store.dispatch(clearUser());
      return;
    }

    // Token exists — verify it in the background.
    // The Redux initial state already restored user from localStorage,
    // so isAuthenticated is already true. This just confirms the token
    // is still valid and refreshes user data.
    axiosInstance
      .get('/api/v1/users/me')
      .then((res) => {
        const user = res.data?.data || res.data;
        if (user?.id) {
          store.dispatch(setUser(user));
        } else {
          store.dispatch(clearUser());
          localStorage.removeItem('accessToken');
          localStorage.removeItem('refreshToken');
        }
      })
      .catch(() => {
        store.dispatch(clearUser());
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      })
      .finally(() => {
        store.dispatch(setLoading(false));
      });
  }, []);

  return <>{children}</>;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <SmoothScrollProvider>
        <AuthInitializer>{children}</AuthInitializer>
      </SmoothScrollProvider>
    </Provider>
  );
}
