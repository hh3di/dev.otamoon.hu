import axios from 'axios';
import type { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from 'axios';

// TypeScript interfaces
interface ApiConfig {
  baseURL: string;
  timeout?: number;
  retries?: number;
}

interface RequestOptions<T = any> {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: T;
  token?: string | null;
  params?: Record<string, any>;
  headers?: Record<string, string>;
}

interface ApiResponse<T = any> {
  data: T;
  status: number;
  headers: Record<string, any>;
}

interface ApiError {
  status: number;
  message: string;
  data?: any;
}

// Default configuration
const DEFAULT_CONFIG: ApiConfig = {
  baseURL: process.env.API_HOST as string,
  retries: 1,
};

export default class ApiService {
  private axiosInstance: AxiosInstance;
  private config: ApiConfig;

  constructor(config: Partial<ApiConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.axiosInstance = this.createAxiosInstance();
    this.setupInterceptors();
  }

  private createAxiosInstance(): AxiosInstance {
    return axios.create({
      baseURL: this.config.baseURL,
      timeout: this.config.timeout,
    });
  }

  private setupInterceptors(): void {
    this.axiosInstance.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;

        if (this.shouldRetry(error) && !originalRequest._retry) {
          originalRequest._retry = true;
          originalRequest._retryCount = (originalRequest._retryCount || 0) + 1;

          if (originalRequest._retryCount <= (this.config.retries || 2)) {
            await this.delay(200);
            return this.axiosInstance(originalRequest);
          }
        }

        throw this.handleError(error);
      },
    );
  }

  private shouldRetry(error: AxiosError): boolean {
    return (
      !error.response ||
      error.code === 'ECONNREFUSED' ||
      error.code === 'ETIMEDOUT' ||
      error.code === 'ENOTFOUND' ||
      (error.response.status >= 500 && error.response.status !== 501)
    );
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  private handleError(error: any): ApiError {
    const response = error.response as AxiosResponse | undefined;
    if (response) {
      return {
        status: response.status,
        message: this.extractErrorMessage(response.data) || response.statusText,
        data: response.data, // Ez tartalmazza a validációs hibákat
      };
    }
    return (
      (error && error.data) || {
        status: 500,
        message: 'Internal Server Error',
      }
    );
  }

  private extractErrorMessage(data: any): string | null {
    if (typeof data === 'string') return data;
    if (data?.message) return data.message;
    if (data?.error) {
      if (typeof data.error === 'string') return data.error;
      if (data.error?.message) return data.error.message;
      if (typeof data.error === 'object') return JSON.stringify(data.error);
    }
    if (data?.errors) {
      if (Array.isArray(data.errors)) {
        return data.errors.map((err: any) => (typeof err === 'string' ? err : err.message || JSON.stringify(err))).join(', ');
      }
      if (typeof data.errors === 'object') return JSON.stringify(data.errors);
      if (typeof data.errors === 'string') return data.errors;
    }
    if (data && typeof data === 'object') {
      return JSON.stringify(data);
    }
    return null;
  }

  private async makeRequest<T = any>({ url, method, data, token, params, headers = {} }: RequestOptions): Promise<ApiResponse<T>> {
    const config: AxiosRequestConfig = {
      url,
      method,
      params,
      headers: {
        ...headers,
        ...(token && { Authorization: `Bearer ${token}` }),
      },
    };

    if (data && ['POST', 'PUT'].includes(method)) {
      config.data = data;
    }

    try {
      const response: AxiosResponse<T> = await this.axiosInstance(config);
      return {
        data: response.data,
        status: response.status,
        headers: response.headers,
      };
    } catch (error: any) {
      // Axios interceptor már ApiError-t dob, de biztosítjuk a típust
      throw this.handleError(error);
    }
  }

  async get<T = any>(url: string, options: Omit<RequestOptions, 'url' | 'method' | 'data'> = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({ ...options, url, method: 'GET' });
  }

  async post<T = any, D = any>(url: string, data?: D, options: Omit<RequestOptions, 'url' | 'method' | 'data'> = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({ ...options, url, method: 'POST', data });
  }

  async put<T = any, D = any>(url: string, data?: D, options: Omit<RequestOptions, 'url' | 'method' | 'data'> = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({ ...options, url, method: 'PUT', data });
  }

  async delete<T = any>(url: string, options: Omit<RequestOptions, 'url' | 'method' | 'data'> = {}): Promise<ApiResponse<T>> {
    return this.makeRequest<T>({ ...options, url, method: 'DELETE' });
  }
}

const apiService = new ApiService();

export const GetRequest = <T = any>(url: string, token?: string | null): Promise<ApiResponse<T>> => {
  return apiService.get<T>(url, { token }).catch((error: ApiError) => {
    throw error;
  });
};

export const PostRequest = <T = any, D = any>(url: string, data?: D, token?: string | null): Promise<ApiResponse<T>> => {
  return apiService.post<T, D>(url, data, { token }).catch((error: ApiError) => {
    throw error;
  });
};

export const PutRequest = <T = any, D = any>(url: string, data?: D, token?: string | null): Promise<ApiResponse<T>> => {
  return apiService.put<T, D>(url, data, { token }).catch((error: ApiError) => {
    throw error;
  });
};

export const DeleteRequest = <T = any>(url: string, token?: string | null): Promise<ApiResponse<T>> => {
  return apiService.delete<T>(url, { token }).catch((error: ApiError) => {
    throw error;
  });
};

export const ApiErrorHandle = async (err: any) => {
  if (err.status === 500 || err.status === 503) {
    return { redirect: '/error?type=server_unavailable' };
  }
  if (err.status === 429) {
    return { redirect: `/error?type=rate_limited&retry_after=${err.retry_after}` };
  }
  return err;
};
