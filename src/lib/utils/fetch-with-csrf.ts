/**
 * CSRF-Protected Fetch Utility - JRM E-commerce Platform
 * CENTRALIZED fetch wrapper with automatic CSRF token injection
 *
 * SINGLE SOURCE OF TRUTH for CSRF-protected fetch requests
 */

import { getCsrfToken } from '@/hooks/use-csrf-token';

/**
 * Fetch wrapper with automatic CSRF token injection
 *
 * USE THIS instead of native fetch() for ALL mutation requests (POST, PUT, DELETE, PATCH)
 *
 * Usage:
 * ```typescript
 * // Simple POST
 * await fetchWithCSRF('/api/admin/products', {
 *   method: 'POST',
 *   body: JSON.stringify(data)
 * });
 *
 * // With custom headers
 * await fetchWithCSRF('/api/admin/orders/123', {
 *   method: 'PUT',
 *   headers: { 'Custom-Header': 'value' },
 *   body: JSON.stringify(data)
 * });
 *
 * // GET requests work normally (no CSRF needed)
 * await fetchWithCSRF('/api/admin/products');
 * ```
 */
export async function fetchWithCSRF(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  const method = init?.method?.toUpperCase() || 'GET';

  // CSRF token only needed for mutation requests - SYSTEMATIC SECURITY
  const mutationMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
  const needsCSRF = mutationMethods.includes(method);

  if (needsCSRF) {
    try {
      // Fetch CSRF token - CENTRALIZED TOKEN MANAGEMENT
      const csrfToken = await getCsrfToken();

      // Inject CSRF token into headers - DRY PRINCIPLE
      const headers = new Headers(init?.headers);
      headers.set('x-csrf-token', csrfToken);

      // Execute request with CSRF token - SYSTEMATIC PROTECTION
      return fetch(input, {
        ...init,
        headers,
      });
    } catch (error) {
      console.error('Failed to get CSRF token:', error);

      // If CSRF token fetch fails, attempt request anyway
      // Server will reject with 403, which is expected behavior
      return fetch(input, init);
    }
  }

  // GET requests don't need CSRF protection - SYSTEMATIC APPROACH
  return fetch(input, init);
}

/**
 * Type-safe JSON fetch with automatic CSRF protection
 *
 * CENTRALIZED typed response handling - DRY PRINCIPLE
 *
 * Usage:
 * ```typescript
 * const product = await fetchJSON<Product>('/api/admin/products/123', {
 *   method: 'PUT',
 *   body: JSON.stringify(updateData)
 * });
 * ```
 */
export async function fetchJSON<T = any>(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<T> {
  // Ensure JSON content type - SYSTEMATIC HEADERS
  const headers = new Headers(init?.headers);
  if (!headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  // Execute CSRF-protected fetch - CENTRALIZED PROTECTION
  const response = await fetchWithCSRF(input, {
    ...init,
    headers,
  });

  // Handle non-OK responses - SYSTEMATIC ERROR HANDLING
  if (!response.ok) {
    let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

    try {
      const errorData = await response.json();
      errorMessage = errorData.message || errorData.error || errorMessage;
    } catch {
      // Response is not JSON, use status text
    }

    throw new Error(errorMessage);
  }

  // Parse and return JSON - TYPE-SAFE RESPONSE
  return response.json();
}

/**
 * Form data fetch with automatic CSRF protection
 *
 * Usage:
 * ```typescript
 * const formData = new FormData();
 * formData.append('file', fileBlob);
 * formData.append('name', 'Product Image');
 *
 * await fetchFormData('/api/admin/products/upload', {
 *   method: 'POST',
 *   body: formData
 * });
 * ```
 */
export async function fetchFormData(
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> {
  // DON'T set Content-Type for FormData - browser will set it with boundary
  // Remove Content-Type if it was set
  const headers = new Headers(init?.headers);
  headers.delete('Content-Type');

  // Execute CSRF-protected fetch - CENTRALIZED PROTECTION
  return fetchWithCSRF(input, {
    ...init,
    headers,
  });
}
