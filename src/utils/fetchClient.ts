/**
 * Global fetch client that automatically handles API URL routing
 */

const getApiBaseUrl = (): string => {
  // Check if we're in production (Netlify)
  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname.includes('netlify.app') || hostname.includes('render.com')) {
      return 'https://otpas-hu-database.onrender.com';
    }
  }
  return 'http://localhost:3000';
};

// Store the original fetch
const originalFetch = window.fetch;

// Override global fetch
export const setupFetchInterceptor = () => {
  window.fetch = function(...args: any[]) {
    let [resource, config] = args;

    // If resource is a string and starts with /, prepend the API base URL
    if (typeof resource === 'string' && resource.startsWith('/')) {
      const baseUrl = getApiBaseUrl();
      resource = `${baseUrl}${resource}`;
    }

    // Call original fetch with modified resource
    return originalFetch.call(this, resource, config);
  } as any;
};
