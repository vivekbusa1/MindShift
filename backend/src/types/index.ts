export interface ApiSuccess<T = unknown> {
  success: true;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: { field: string; message: string }[];
  };
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError;

export function successResponse<T>(data: T, meta?: ApiSuccess<T>['meta']): ApiSuccess<T> {
  return { success: true, data, ...(meta ? { meta } : {}) };
}

export function errorResponse(
  code: string,
  message: string,
  details?: { field: string; message: string }[]
): ApiError {
  return {
    success: false,
    error: { code, message, ...(details ? { details } : {}) },
  };
}

// ── Token payload types ───────────────────────────────────────────────────────
export interface AccessTokenPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface RefreshTokenPayload {
  sessionId: string;
  userId: string;
  iat?: number;
  exp?: number;
}
