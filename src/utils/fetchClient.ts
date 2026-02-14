/**
 * Global fetch client that automatically handles API URL routing
 */

const getApiBaseUrl = (): string => {
  // First check environment variable (set by Vite)
  const envUrl = import.meta.env.VITE_API_URL;
  if (envUrl && envUrl !== 'undefined') {
    console.log('[API] Using environment variable URL:', envUrl);
    return envUrl;
  }

  // Check if we're in production (not localhost)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    console.log('[API] Current hostname:', hostname);
    
    // If not localhost, use production backend
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      console.log('[API] Using production backend URL for hostname:', hostname);
      return 'https://otpas-hu-database.onrender.com';
    }
  }
  
  console.log('[API] Using localhost backend URL');
  return 'http://localhost:3000';
};

// Store the original fetch
const originalFetch = globalThis.fetch;

// Override global fetch
export const setupFetchInterceptor = () => {
  console.log('[API] Setting up fetch interceptor');
  console.log('[API] Environment VITE_API_URL:', import.meta.env.VITE_API_URL);
  console.log('[API] Window hostname:', typeof window !== 'undefined' ? window.location.hostname : 'N/A');
  
  globalThis.fetch = ((resource: any, config?: any) => {
    let url = resource;
    
    // If resource is a string and starts with /, prepend the API base URL
    if (typeof resource === 'string' && resource.startsWith('/')) {
      const baseUrl = getApiBaseUrl();
      url = `${baseUrl}${resource}`;
      console.log('[API] Intercepted request:', resource, '→', url);
    }

    // Call original fetch with modified resource
    return originalFetch(url, config).catch((error: any) => {
      console.error('[API] Fetch error for', url, ':', error);
      throw error;
    });
  }) as any;
};
