/**
 * API Response Utilities
 * 
 * Centralized utilities for extracting data from API responses.
 * The backend returns { status, message, data: X, metadata? } and
 * axiosBaseQuery unwraps this - these helpers standardize the extraction.
 */

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * Extract data from any API response.
 * Handles both direct arrays and { data: T } wrapped responses.
 */
export const extractData = <T>(response: unknown): T | undefined => {
  if (response === null || response === undefined) return undefined;
  if (Array.isArray(response)) return response as T;
  return (response as { data?: T })?.data ?? (response as T);
};

/**
 * Extract paginated data with metadata.
 * Returns consistent shape even if response is malformed.
 */
export const extractPaginatedData = <T>(response: unknown): { 
  data: T[]; 
  pagination: PaginationMeta;
} => {
  const r = response as { 
    data?: T[]; 
    pagination?: Partial<PaginationMeta>;
    metadata?: { pagination?: Partial<PaginationMeta> };
  } | undefined;
  
  // Support both direct pagination and metadata.pagination patterns
  const pagination = r?.pagination ?? r?.metadata?.pagination ?? {};
  
  return {
    data: r?.data ?? [],
    pagination: {
      page: pagination.page ?? 1,
      limit: pagination.limit ?? 10,
      total: pagination.total ?? 0,
      totalPages: pagination.totalPages ?? 0,
    },
  };
};

/**
 * Extract cart from response.
 * Backend returns cart data directly or nested under 'cart' key.
 */
export const extractCart = (response: unknown): unknown => {
  if (!response) return null;
  const r = response as { cart?: unknown; data?: { cart?: unknown } } | undefined;
  return r?.cart ?? r?.data?.cart ?? response;
};

/**
 * Extract wishlist items from response.
 */
export const extractWishlist = (response: unknown): unknown[] => {
  const data = extractData<unknown[]>(response);
  return data ?? (Array.isArray(response) ? response : []);
};

/**
 * Extract addresses from response (returns plain array).
 */
export const extractAddresses = (response: unknown): unknown[] => {
  if (Array.isArray(response)) return response;
  const data = extractData<unknown[]>(response);
  return data ?? [];
};

/**
 * Extract user profile from response.
 */
export const extractProfile = (response: unknown): unknown => {
  if (!response) return null;
  if (typeof response === 'object' && 'id' in response) return response;
  return extractData<unknown>(response);
};

/**
 * Extract unread count from notifications response.
 */
export const extractUnreadCount = (response: unknown): number => {
  const r = response as { unreadCount?: number; data?: { unreadCount?: number } } | undefined;
  return r?.unreadCount ?? r?.data?.unreadCount ?? 0;
};
