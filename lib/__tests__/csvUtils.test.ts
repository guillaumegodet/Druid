import { describe, it, expect } from 'vitest';
import { csvEscape, isoDateOrEmpty } from '../csvUtils';

describe('csvEscape', () => {
  it('returns plain strings unchanged', () => {
    expect(csvEscape('hello')).toBe('hello');
  });

  it('wraps values containing a comma in double quotes', () => {
    expect(csvEscape('hello, world')).toBe('"hello, world"');
  });

  it('escapes embedded double quotes by doubling them', () => {
    expect(csvEscape('say "hi"')).toBe('"say ""hi"""');
  });

  it('wraps values containing a newline in double quotes', () => {
    expect(csvEscape('line1\nline2')).toBe('"line1\nline2"');
  });

  it('converts null to an empty string', () => {
    expect(csvEscape(null)).toBe('');
  });

  it('converts undefined to an empty string', () => {
    expect(csvEscape(undefined)).toBe('');
  });

  it('converts numbers to their string representation', () => {
    expect(csvEscape(42)).toBe('42');
  });

  it('handles an empty string without wrapping', () => {
    expect(csvEscape('')).toBe('');
  });
});

describe('isoDateOrEmpty', () => {
  it('returns a valid ISO date unchanged', () => {
    expect(isoDateOrEmpty('2024-01-15')).toBe('2024-01-15');
  });

  it('returns empty string for a non-ISO date format', () => {
    expect(isoDateOrEmpty('15/01/2024')).toBe('');
  });

  it('returns empty string for an empty value', () => {
    expect(isoDateOrEmpty('')).toBe('');
  });

  it('returns empty string for null', () => {
    expect(isoDateOrEmpty(null)).toBe('');
  });

  it('returns empty string for undefined', () => {
    expect(isoDateOrEmpty(undefined)).toBe('');
  });
});
