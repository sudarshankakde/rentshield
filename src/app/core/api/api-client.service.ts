import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders, HttpParams } from '@angular/common/http';
import { catchError, Observable, throwError } from 'rxjs';

export type QueryValue = string | number | boolean | null | undefined;
export type QueryParams = Record<string, QueryValue>;

export interface RequestOptions {
  query?: QueryParams;
  headers?: HttpHeaders | Record<string, string>;
}

@Injectable({ providedIn: 'root' })
export class ApiClientService {
  private readonly http = inject(HttpClient);

  private readonly baseUrl = this.resolveBaseUrl();

  get<T>(path: string, options?: RequestOptions): Observable<T> {
    return this.http
      .get<T>(this.url(path), {
        params: this.toHttpParams(options?.query),
        headers: options?.headers,
      })
      .pipe(catchError((error) => this.normalizeError(error)));
  }

  getBlob(path: string, options?: RequestOptions): Observable<Blob> {
    return this.http
      .get(this.url(path), {
        params: this.toHttpParams(options?.query),
        headers: options?.headers,
        responseType: 'blob',
      })
      .pipe(catchError((error) => this.normalizeError(error)));
  }

  post<T>(path: string, body?: unknown, options?: RequestOptions): Observable<T> {
    return this.http
      .post<T>(this.url(path), body ?? {}, {
        params: this.toHttpParams(options?.query),
        headers: options?.headers,
      })
      .pipe(catchError((error) => this.normalizeError(error)));
  }

  put<T>(path: string, body?: unknown, options?: RequestOptions): Observable<T> {
    return this.http
      .put<T>(this.url(path), body ?? {}, {
        params: this.toHttpParams(options?.query),
        headers: options?.headers,
      })
      .pipe(catchError((error) => this.normalizeError(error)));
  }

  patch<T>(path: string, body?: unknown, options?: RequestOptions): Observable<T> {
    return this.http
      .patch<T>(this.url(path), body ?? {}, {
        params: this.toHttpParams(options?.query),
        headers: options?.headers,
      })
      .pipe(catchError((error) => this.normalizeError(error)));
  }

  delete<T>(path: string, options?: RequestOptions): Observable<T> {
    return this.http
      .delete<T>(this.url(path), {
        params: this.toHttpParams(options?.query),
        headers: options?.headers,
      })
      .pipe(catchError((error) => this.normalizeError(error)));
  }

  private resolveBaseUrl(): string {
    const env = (import.meta as ImportMeta & { env?: Record<string, string | undefined> }).env ?? {};
    const configured = env['VITE_API_BASE_URL']?.trim();
    const fallback = 'import.meta.env.VITE_API_BASE_URL';
    const base = configured && configured.length > 0 ? configured : fallback;
    return base.endsWith('/') ? base.slice(0, -1) : base;
  }

  private url(path: string): string {
    if (path.startsWith('http://') || path.startsWith('https://')) {
      return path;
    }

    const normalizedPath = path.startsWith('/') ? path : `/${path}`;
    return `${this.baseUrl}${normalizedPath}`;
  }

  private toHttpParams(query?: QueryParams): HttpParams {
    let params = new HttpParams();
    if (!query) {
      return params;
    }

    for (const [key, value] of Object.entries(query)) {
      if (value === undefined || value === null || value === '') {
        continue;
      }
      params = params.set(key, String(value));
    }

    return params;
  }

  private normalizeError(error: unknown): Observable<never> {
    if (error instanceof HttpErrorResponse) {
      const backendPayload = error.error;
      const backendMessage =
        typeof backendPayload === 'object' && backendPayload !== null
          ? String(
              (backendPayload as { message?: unknown; error?: unknown }).message ??
              (backendPayload as { message?: unknown; error?: unknown }).error ??
              ''
            ).trim() || undefined
          : undefined;

      const message = backendMessage ?? error.message ?? 'Unexpected API error.';
      return throwError(() => new Error(message));
    }

    return throwError(() => new Error('Unexpected API error.'));
  }
}
