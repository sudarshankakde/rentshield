export function assertRequiredString(value: unknown, fieldName: string): asserts value is string {
  if (typeof value !== 'string' || value.trim().length === 0) {
    throw new Error(`${fieldName} is required.`);
  }
}

export function assertEmail(value: unknown, fieldName: string): asserts value is string {
  assertRequiredString(value, fieldName);
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(value)) {
    throw new Error(`${fieldName} must be a valid email.`);
  }
}

export function assertMinLength(value: unknown, fieldName: string, minLength: number): asserts value is string {
  assertRequiredString(value, fieldName);
  if (value.length < minLength) {
    throw new Error(`${fieldName} must be at least ${minLength} characters.`);
  }
}

export function assertNumberInRange(value: unknown, fieldName: string, min: number, max: number): asserts value is number {
  if (typeof value !== 'number' || Number.isNaN(value) || value < min || value > max) {
    throw new Error(`${fieldName} must be a number between ${min} and ${max}.`);
  }
}

export function assertObject(value: unknown, context: string): asserts value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error(`${context} must be an object.`);
  }
}

export function readString(value: unknown, fallback = ''): string {
  return typeof value === 'string' ? value : fallback;
}

export function readNumber(value: unknown, fallback = 0): number {
  return typeof value === 'number' && Number.isFinite(value) ? value : fallback;
}

export function readBoolean(value: unknown, fallback = false): boolean {
  return typeof value === 'boolean' ? value : fallback;
}

export function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}
