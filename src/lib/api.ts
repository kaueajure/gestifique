import { User } from '../types';

const API_BASE = '/api';

interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data: T;
  errors?: string[];
}

class ApiService {
  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const response = await fetch(`${API_BASE}${endpoint}`, {
      ...options,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
    });

    if (response.status === 401) {
      // Avoid triggering unauthorized event for the initial auth check if it fails silently
      // Only trigger if we are not on the login/profile check or if the app expects to be authenticated
      const isPublicEndpoint = endpoint === '/profile' || endpoint === '/auth/login';
      
      // We still want to trigger it if the user WAS logged in or if it's a critical failure
      // To keep it simple as requested:
      window.dispatchEvent(new CustomEvent('api:unauthorized', { detail: { endpoint } }));
      throw new Error('Sessão expirada. Faça login novamente.');
    }

    const result: ApiResponse<T> = await response.json();

    if (!result.success) {
      throw new Error(result.message || 'Erro na requisição');
    }

    return result.data;
  }

  get<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  post<T>(endpoint: string, body: any) {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  patch<T>(endpoint: string, body: any) {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  }

  delete<T>(endpoint: string) {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const api = new ApiService();
