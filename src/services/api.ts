/**
 * Base API Client
 * Provides common functionality for all API calls
 */

// Get API base URL - use relative path for proxy in development
const getApiBaseUrl = () => {
  // In development, use relative path which will be proxied by Vite
  // In production, use environment variable or default
  if (import.meta.env.DEV) {
    return '/api'; // This will be proxied to http://localhost:5001/api by Vite
  }
  return import.meta.env.VITE_API_URL || '/api';
};

const API_BASE_URL = getApiBaseUrl();

// Helper to get auth token
export const getAuthToken = (): string | null => {
  return localStorage.getItem('authToken');
};

// Helper to get headers with auth
export const getHeaders = (includeAuth: boolean = true): HeadersInit => {
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };

  if (includeAuth) {
    const token = getAuthToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  return headers;
};

// API Error class
export class ApiError extends Error {
  constructor(
    message: string,
    public status?: number,
    public data?: any
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

// Generic API request handler
export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  
  // Check if body is FormData
  const isFormData = options.body instanceof FormData;
  
  try {
    const response = await fetch(url, {
      ...options,
      headers: isFormData ? {
        // For FormData, only add Authorization, let browser set Content-Type with boundary
        ...options.headers,
      } : {
        ...getHeaders(),
        ...options.headers,
      },
    });

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    if (!response.ok) {
      const errorData = isJson ? await response.json() : { message: response.statusText };
      throw new ApiError(
        errorData.message || `Request failed with status ${response.status}`,
        response.status,
        errorData
      );
    }

    // Return parsed JSON or empty object for 204 No Content
    if (response.status === 204) {
      return {} as T;
    }

    return isJson ? await response.json() : ({} as T);
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Network or other errors
    throw new ApiError(
      error instanceof Error ? error.message : 'An unexpected error occurred'
    );
  }
}

// Convenience methods
export const api = {
  get: <T>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'GET' }),

  post: <T>(endpoint: string, data?: any, options?: RequestInit) => {
    const isFormData = data instanceof FormData;
    return apiRequest<T>(endpoint, {
      ...options,
      method: 'POST',
      body: isFormData ? data : (data ? JSON.stringify(data) : undefined),
      headers: isFormData ? {
        // Don't set Content-Type for FormData - let browser set it with boundary
        'Authorization': options?.headers?.['Authorization'] || `Bearer ${getAuthToken()}`,
      } : options?.headers,
    });
  },

  put: <T>(endpoint: string, data?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    }),

  patch: <T>(endpoint: string, data?: any, options?: RequestInit) =>
    apiRequest<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    }),

  delete: <T>(endpoint: string, options?: RequestInit) =>
    apiRequest<T>(endpoint, { ...options, method: 'DELETE' }),
};

export default api;
