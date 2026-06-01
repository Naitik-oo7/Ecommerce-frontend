import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { getAccessToken, isPersistedAuth } from '@/lib/authTokens';

interface User {
  id: number;
  name: string;
  email: string;
  role: 'customer' | 'admin';
  avatar?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

function getPersistedUser(): User | null {
  if (typeof window === 'undefined') return null;
  try {
    const stored = localStorage.getItem('user') ?? sessionStorage.getItem('user');
    if (stored) {
      const user = JSON.parse(stored);
      if (user?.id) return user;
    }
  } catch {}
  return null;
}

function hasToken(): boolean {
  return !!getAccessToken();
}

const persistedUser = getPersistedUser();

const initialState: AuthState = {
  user: persistedUser,
  isAuthenticated: !!persistedUser && hasToken(),
  isLoading: !persistedUser && hasToken(),
};

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      state.isLoading = false;
      if (typeof window !== 'undefined') {
        const storage = isPersistedAuth() ? localStorage : sessionStorage;
        storage.setItem('user', JSON.stringify(action.payload));
      }
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      state.isLoading = false;
      if (typeof window !== 'undefined') {
        localStorage.removeItem('user');
        sessionStorage.removeItem('user');
      }
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },
  },
});

export const { setUser, clearUser, setLoading } = authSlice.actions;
export default authSlice.reducer;
