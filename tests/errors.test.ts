import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeError, PluginError } from '../src/errors.ts';

test('maps AnyDoc errors and preserves original code and detail', () => {
  assert.deepEqual(normalizeError(Object.assign(new Error('page 2 needs OCR'), { code: 'needsOcr' })), {
    code: 'OCR_REQUIRED', message: 'page 2 needs OCR', cause_code: 'needsOcr',
  });
  assert.deepEqual(normalizeError(new PluginError('EMPTY_RESULT', 'Empty')), { code: 'EMPTY_RESULT', message: 'Empty' });
});
