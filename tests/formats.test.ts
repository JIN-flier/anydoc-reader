import assert from 'node:assert/strict';
import test from 'node:test';
import { formats, normalizeFormat } from '../src/formats.ts';

test('format registry contains every specified extension', () => {
  assert.deepEqual(formats.flatMap(group => group.extensions), ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.pdf', '.odt', '.rtf', '.epub', '.csv']);
});

test('explicit format is case insensitive and accepts a dot', () => {
  assert.equal(normalizeFormat('.PDF'), 'pdf');
  assert.equal(normalizeFormat('DoCx'), 'docx');
  assert.equal(normalizeFormat('txt'), null);
});
