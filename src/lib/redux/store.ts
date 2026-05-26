import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import authReducer from './authSlice';
import { authApi } from '../../services/api/authApi';
import { productsApi } from '../../services/api/productsApi';
import { cartApi } from '../../services/api/cartApi';
import { ordersApi } from '../../services/api/ordersApi';
import { usersApi } from '../../services/api/usersApi';
import { adminApi } from '../../services/api/adminApi';
import { wishlistApi } from '../../services/api/wishlistApi';
import { reviewsApi } from '../../services/api/reviewsApi';
import { addressesApi } from '../../services/api/addressesApi';
import { categoriesApi } from '../../services/api/categoriesApi';
import { couponsApi } from '../../services/api/couponsApi';
import { paymentsApi } from '../../services/api/paymentsApi';
import { notificationsApi } from '../../services/api/notificationsApi';
import { tagsApi } from '../../services/api/tagsApi';
import { uploadApi } from '../../services/api/uploadApi';
import { settingsApi } from '../../services/api/settingsApi';
import { blogApi } from '../../services/api/blogApi';
import { newsletterApi } from '../../services/api/newsletterApi';
import { contactApi } from '../../services/api/contactApi';

const apis = [
  authApi, productsApi, cartApi, ordersApi, usersApi, adminApi,
  wishlistApi, reviewsApi, addressesApi, categoriesApi, couponsApi,
  paymentsApi, notificationsApi, tagsApi, uploadApi, settingsApi,
  blogApi, newsletterApi, contactApi,
];

export const store = configureStore({
  reducer: {
    auth: authReducer,
    ...Object.fromEntries(apis.map((api) => [api.reducerPath, api.reducer])),
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apis.map((api) => api.middleware)),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
