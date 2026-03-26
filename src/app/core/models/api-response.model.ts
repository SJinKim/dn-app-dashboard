export interface ApiResponse<T> {
  success: boolean;
  message: string | null;
  data: T | null;
}

/** Spring Page response shape */
export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  number: number;   // current page (0-based)
  size: number;
}
