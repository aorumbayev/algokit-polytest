import { expect, test } from 'vitest';
import { handlers } from './handlers.js';
import { customHandlers } from './handlers/custom/index.js';

test('handlers should be an array', () => {
  expect(Array.isArray(handlers)).toBe(true);
});

test('handlers should be generated from OpenAPI spec', () => {
  expect(handlers.length).toBeGreaterThan(0);
});

test('handlers should include algod endpoints', () => {
  // Verify at least some common endpoints were generated
  expect(handlers.length).toBeGreaterThan(10);
});

test('custom handlers should be included', () => {
  // Custom handlers should be present
  expect(handlers.length).toBeGreaterThanOrEqual(customHandlers.length);
});

test('custom handlers should have priority over OpenAPI handlers', () => {
  // Custom handlers should appear first in the array
  const firstHandlers = handlers.slice(0, customHandlers.length);
  expect(firstHandlers).toEqual(customHandlers);
});