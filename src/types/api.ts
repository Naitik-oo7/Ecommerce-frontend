export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ApiError {
  status: number;
  message: string;
  data?: Record<string, string[]>;
}

export interface ApiResponse<T> {
  status: string;
  message: string;
  data: T;
  metadata?: {
    pagination?: PaginatedResponse<unknown>['pagination'];
  };
}
