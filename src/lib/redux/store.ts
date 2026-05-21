import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import authReducer from './authSlice';
import cartReducer from './cartSlice';
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

export const store = configureStore({
  reducer: {
    auth: authReducer,
    cart: cartReducer,
    [authApi.reducerPath]:       authApi.reducer,
    [productsApi.reducerPath]:   productsApi.reducer,
    [cartApi.reducerPath]:       cartApi.reducer,
    [ordersApi.reducerPath]:     ordersApi.reducer,
    [usersApi.reducerPath]:      usersApi.reducer,
    [adminApi.reducerPath]:      adminApi.reducer,
    [wishlistApi.reducerPath]:   wishlistApi.reducer,
    [reviewsApi.reducerPath]:    reviewsApi.reducer,
    [addressesApi.reducerPath]:  addressesApi.reducer,
    [categoriesApi.reducerPath]: categoriesApi.reducer,
    [couponsApi.reducerPath]:    couponsApi.reducer,
    [paymentsApi.reducerPath]:   paymentsApi.reducer,
    [notificationsApi.reducerPath]: notificationsApi.reducer,
    [tagsApi.reducerPath]:       tagsApi.reducer,
    [uploadApi.reducerPath]:     uploadApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(
      authApi.middleware,
      productsApi.middleware,
      cartApi.middleware,
      ordersApi.middleware,
      usersApi.middleware,
      adminApi.middleware,
      wishlistApi.middleware,
      reviewsApi.middleware,
      addressesApi.middleware,
      categoriesApi.middleware,
      couponsApi.middleware,
      paymentsApi.middleware,
      notificationsApi.middleware,
      tagsApi.middleware,
      uploadApi.middleware,
    ),
});

setupListeners(store.dispatch);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
