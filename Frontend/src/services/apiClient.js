import { getCookie } from '../utils/cookies';



const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

class ApiClient {
  constructor() {
    this.baseUrl = API_BASE_URL;
  }

  
  getCsrfToken() {
    return getCookie('XSRF-TOKEN');
  }

  
  async request(endpoint, options = {}) {
    const csrfToken = this.getCsrfToken();
    
    const headers = {
      'Content-Type': 'application/json',
      ...options.headers,
    };
    
    // Add CSRF token for state-changing requests
    const method = (options.method || 'GET').toUpperCase();
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(method) && csrfToken) {
      headers['X-CSRF-Token'] = csrfToken;
    }
    
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;
    
    try {
      const response = await fetch(url, {
        ...options,
        method,
        headers,
        credentials: 'include', // Important: includes cookies
      });
      
      // Handle non-JSON responses
      const contentType = response.headers.get('content-type');
      const isJson = contentType && contentType.includes('application/json');
      
      let data;
      if (isJson) {
        data = await response.json();
      } else {
        data = await response.text();
      }
      
      if (!response.ok) {
        // Handle CSRF token errors specifically
        if (response.status === 403 && isJson && data.error?.includes('CSRF')) {
          console.error('CSRF token error:', data.error);
          throw new Error('Security token expired. Please refresh the page and try again.');
        }
        
        // Handle other errors
        const errorMessage = isJson 
          ? (data.error || data.message || 'Request failed')
          : `HTTP error! status: ${response.status}`;
        throw new Error(errorMessage);
      }
      
      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  }


  post(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  put(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  
  patch(endpoint, data, options = {}) {
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  }

  async fetchCsrfToken() {
    try {
      const data = await this.get('/api/csrf-token');
      return data.csrfToken;
    } catch (error) {
      console.error('Failed to fetch CSRF token:', error);
      throw error;
    }
  }
}

// Export a singleton instance
const apiClient = new ApiClient();
export default apiClient;

// Also export the class for custom instances if needed
export { ApiClient };