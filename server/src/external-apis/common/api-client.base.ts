import { Logger } from '@nestjs/common';
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios';

export interface ApiClientConfig {
  baseURL: string;
  timeout: number;
  maxRetries: number;
  headers?: Record<string, string>;
  retryCondition?: (error: any) => boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  timestamp: string;
  responseTime: number;
  metadata?: {
    pageNo?: number;
    numOfRows?: number;
    totalCount?: number;
    totalPages?: number;
    [key: string]: any;
  };
}

export abstract class ApiClientBase {
  protected readonly logger: Logger;
  protected readonly axiosInstance: AxiosInstance;
  protected readonly config: ApiClientConfig;

  constructor(config: ApiClientConfig, loggerName: string) {
    this.config = config;
    this.logger = new Logger(loggerName);

    this.axiosInstance = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout,
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'GoldenRace-API-Client/1.0.0',
        ...config.headers,
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // 요청 인터셉터
    this.axiosInstance.interceptors.request.use(
      config => {
        this.logger.debug(
          `API Request: ${config.method?.toUpperCase()} ${config.url}`
        );
        return config;
      },
      error => {
        this.logger.error('Request interceptor error', error);
        return Promise.reject(error);
      }
    );

    // 응답 인터셉터
    this.axiosInstance.interceptors.response.use(
      (response: AxiosResponse) => {
        this.logger.debug(
          `API Response: ${response.status} ${response.config.url}`
        );
        return response;
      },
      error => {
        this.logger.error('Response interceptor error', error);
        return Promise.reject(error);
      }
    );
  }

  protected async makeRequest<T>(
    config: AxiosRequestConfig,
    retryCount = 0
  ): Promise<ApiResponse<T>> {
    const startTime = Date.now();

    try {
      const response = await this.axiosInstance.request<T>(config);
      const responseTime = Date.now() - startTime;

      return {
        success: true,
        data: response.data,
        timestamp: new Date().toISOString(),
        responseTime,
      };
    } catch (error) {
      const responseTime = Date.now() - startTime;

      if (this.shouldRetry(error, retryCount)) {
        this.logger.warn(
          `Retrying request (${retryCount + 1}/${this.config.maxRetries})`
        );
        await this.delay(this.getRetryDelay(retryCount));
        return this.makeRequest<T>(config, retryCount + 1);
      }

      return {
        success: false,
        error: {
          code: this.getErrorCode(error),
          message: this.getErrorMessage(error),
          details: error,
        },
        timestamp: new Date().toISOString(),
        responseTime,
      };
    }
  }

  private shouldRetry(error: any, retryCount: number): boolean {
    if (retryCount >= this.config.maxRetries) {
      return false;
    }

    if (this.config.retryCondition) {
      return this.config.retryCondition(error);
    }

    // 기본 재시도 조건
    if (error.response) {
      const status = error.response.status;
      return status >= 500 && status < 600; // 5xx 서버 오류
    }

    // 네트워크 오류
    return error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT';
  }

  private getRetryDelay(retryCount: number): number {
    // 지수 백오프: 1초, 2초, 4초, 8초...
    return Math.min(1000 * Math.pow(2, retryCount), 10000);
  }

  private getErrorCode(error: any): string {
    if (error.response) {
      return `HTTP_${error.response.status}`;
    }
    if (error.code) {
      return error.code;
    }
    return 'UNKNOWN_ERROR';
  }

  private getErrorMessage(error: any): string {
    if (error.response?.data?.message) {
      return error.response.data.message;
    }
    if (error.message) {
      return error.message;
    }
    return 'An unknown error occurred';
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  protected logApiCall(
    method: string,
    url: string,
    success: boolean,
    responseTime: number
  ) {
    const logLevel = success ? 'debug' : 'error';
    const message = `API ${method} ${url} - ${success ? 'SUCCESS' : 'FAILED'} (${responseTime}ms)`;

    if (success) {
      this.logger.debug(message);
    } else {
      this.logger.error(message);
    }
  }

  protected validateResponse<T>(response: ApiResponse<T>): T {
    if (!response.success || !response.data) {
      throw new Error(
        response.error?.message || 'API response validation failed'
      );
    }
    return response.data;
  }
}
