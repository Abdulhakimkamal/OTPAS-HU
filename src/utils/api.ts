/**
 * API utility functions
 */

export const getBackendUrl = (): string => {
  // In production (Netlify), use the production backend URL
  // In development, use localhost
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return 'https://otpas-hu-database.onrender.com';
  }
  return 'http://localhost:3000';
};

export const getApiUrl = (endpoint: string): string => {
  const baseUrl = getBackendUrl();
  return `${baseUrl}${endpoint}`;
};
