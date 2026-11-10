import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { convert } from '../src/tools/convert.ts';
import { listFormats } from '../src/tools/formats.ts';
import extension from '../src/index.ts';

test('real AnyDoc converts CSV inline and through explicit format override', async () => {
  const root = await mkdtemp(join(tmpdir(), 'anydoc-integration-'));
  await writeFile(join(root, 'data.csv'), 'name,score\nAda,42\n');
  await writeFile(join(root, 'data.bin'), 'name,score\nAda,42\n');
  const inline = await convert({ path: 'data.csv' }, root);
  assert.equal(inline.success, true);
  if (inline.success && inline.mode === 'inline') assert.match(inline.markdown, /Ada.*42/);
  const saved = await convert({ path: 'data.bin', format: 'CSV', output_dir: '.pi/anydoc-tmp/' }, root);
  assert.equal(saved.success, true);
  if (saved.success && saved.mode === 'file') assert.match(await readFile(saved.markdown_path, 'utf8'), /Ada.*42/);
});

test('extension registers exactly the requested tools', () => {
  const names: string[] = [];
  extension({ registerTool: (definition: { name: string }) => { names.push(definition.name); } } as unknown as Parameters<typeof extension>[0]);
  assert.deepEqual(names, ['anydoc_convert', 'anydoc_formats']);
  assert.deepEqual(listFormats().formats.flatMap(group => group.extensions), ['.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx', '.pdf', '.odt', '.rtf', '.epub', '.csv']);
});
