export const ROUTES = {
  // Public
  HOME: '/',
  PRODUCTS: '/products',
  PRODUCT_DETAIL: (slug: string) => `/products/${slug}`,
  
  // Auth
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT_PASSWORD: '/forgot-password',
  RESET_PASSWORD: '/reset-password',
  
  // Customer
  CART: '/cart',
  CHECKOUT: '/checkout',
  ORDERS: '/profile/orders',
  ORDER_DETAIL: (id: string | number) => `/orders/${id}`,
  ORDER_PLACED: (id: string | number) => `/order-placed/${id}`,
  PROFILE: '/profile',
  ADDRESSES: '/profile/addresses',
  SETTINGS: '/profile/settings',
  WISHLIST: '/wishlist',
  NOTIFICATIONS: '/notifications',
  
  // Admin
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    PRODUCTS: '/admin/products',
    PRODUCT_EDIT: (slug: string) => `/admin/products/${slug}/edit`,
    PRODUCT_NEW: '/admin/products/new',
    CATEGORIES: '/admin/categories',
    ORDERS: '/admin/orders',
    ORDER_DETAIL: (id: string | number) => `/admin/orders/${id}`,
    USERS: '/admin/users',
    COUPONS: '/admin/coupons',
    REVIEWS: '/admin/reviews',
    BLOG: '/admin/blog',
    CONTACTS: '/admin/contacts',
    SETTINGS: '/admin/settings',
  },
} as const;
