/**
 * API utility functions
 */

export const getBackendUrl = (): string => {
  // Use the environment variable set by Vite
  const apiUrl = import.meta.env.VITE_API_URL;
  if (apiUrl) {
    return apiUrl;
  }
  
  // Fallback: detect based on hostname
  if (typeof window !== 'undefined' && window.location.hostname !== 'localhost') {
    return 'https://otpas-hu-database.onrender.com';
  }
  return 'http://localhost:3000';
};

export const getApiUrl = (endpoint: string): string => {
  const baseUrl = getBackendUrl();
  return `${baseUrl}${endpoint}`;
};
