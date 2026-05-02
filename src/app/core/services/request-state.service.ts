import { Signal, WritableSignal, signal } from '@angular/core';
import { Observable, firstValueFrom } from 'rxjs';

export interface RequestRunOptions<T> {
  successMessage?: string;
  errorMessage?: string;
  preserveSuccess?: boolean;
  onSuccess?: (value: T) => void;
  onError?: (error: Error) => void;
  rethrow?: boolean;
}

export interface RequestState<T> {
  loading: Signal<boolean>;
  error: Signal<string | null>;
  success: Signal<string | null>;
  data: Signal<T | null>;
  runPromise: (task: Promise<T>, options?: RequestRunOptions<T>) => Promise<T | null>;
  runObservable: (task: Observable<T>, options?: RequestRunOptions<T>) => Promise<T | null>;
  setData: (value: T | null) => void;
  setSuccess: (message: string | null) => void;
  setError: (message: string | null) => void;
  resetFeedback: () => void;
}

export function createRequestState<T>(initialData: T | null = null): RequestState<T> {
  const loading: WritableSignal<boolean> = signal(false);
  const error: WritableSignal<string | null> = signal(null);
  const success: WritableSignal<string | null> = signal(null);
  const data: WritableSignal<T | null> = signal(initialData);

  const execute = async (task: Promise<T>, options?: RequestRunOptions<T>): Promise<T | null> => {
    if (loading()) {
      return null;
    }

    loading.set(true);
    error.set(null);
    if (!options?.preserveSuccess) {
      success.set(null);
    }

    try {
      const value = await task;
      data.set(value);

      if (options?.successMessage) {
        success.set(options.successMessage);
      }

      options?.onSuccess?.(value);
      return value;
    } catch (rawError) {
      const err = rawError instanceof Error ? rawError : new Error(options?.errorMessage ?? 'Request failed.');
      const message = options?.errorMessage ?? err.message;
      error.set(message);
      options?.onError?.(err);

      if (options?.rethrow) {
        throw err;
      }

      return null;
    } finally {
      loading.set(false);
    }
  };

  return {
    loading: loading.asReadonly(),
    error: error.asReadonly(),
    success: success.asReadonly(),
    data: data.asReadonly(),
    runPromise: (task, options) => execute(task, options),
    runObservable: (task, options) => execute(firstValueFrom(task), options),
    setData: (value) => data.set(value),
    setSuccess: (message) => success.set(message),
    setError: (message) => error.set(message),
    resetFeedback: () => {
      error.set(null);
      success.set(null);
    },
  };
}
