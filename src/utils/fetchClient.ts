/**
 * Global fetch client that automatically handles API URL routing
 */

const getApiBaseUrl = (): string => {
  // Check if we're in production (Netlify)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    console.log('[API] Current hostname:', hostname);
    if (hostname.includes('netlify.app')) {
      console.log('[API] Using production backend URL');
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
