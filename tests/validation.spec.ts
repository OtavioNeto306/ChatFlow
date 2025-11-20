import { describe, it, expect } from 'vitest';
import { isValidEmail, isNonEmpty } from '../utils/validation';

describe('validation utils', () => {
  it('validates email format', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
    expect(isValidEmail('invalid')).toBe(false);
    expect(isValidEmail('a@b')).toBe(false);
  });

  it('validates non-empty string', () => {
    expect(isNonEmpty('x')).toBe(true);
    expect(isNonEmpty('   ')).toBe(false);
  });
});

