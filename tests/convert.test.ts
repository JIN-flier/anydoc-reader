import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, writeFile, readdir, readFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { convert } from '../src/tools/convert.ts';

test('inline conversion returns markdown and creates no output', async () => {
  const root = await mkdtemp(join(tmpdir(), 'anydoc-'));
  await writeFile(join(root, 'a.pdf'), 'source');
  const result = await convert({ path: 'a.pdf' }, root, async () => '# A');
  assert.deepEqual(result, { success: true, mode: 'inline', source_path: join(root, 'a.pdf'), format: 'pdf', markdown: '# A' });
  assert.deepEqual(await readdir(root), ['a.pdf']);
});

test('file conversion saves markdown and does not overwrite prior result', async () => {
  const root = await mkdtemp(join(tmpdir(), 'anydoc-'));
  await writeFile(join(root, 'a.csv'), 'a,b');
  const params = { path: 'a.csv', output_dir: '.pi/anydoc-tmp/' };
  const first = await convert(params, root, async () => '# First');
  const second = await convert(params, root, async () => '# Second');
  assert.equal(first.success, true);
  assert.equal(second.success, true);
  if (first.success && first.mode === 'file' && second.success && second.mode === 'file') {
    assert.notEqual(first.markdown_path, second.markdown_path);
    assert.equal(await readFile(first.markdown_path, 'utf8'), '# First');
  }
});

test('rejects missing files, unsupported formats and forbidden output', async () => {
  const root = await mkdtemp(join(tmpdir(), 'anydoc-'));
  assert.equal((await convert({path:'missing.pdf'}, root, async()=>'' )).success, false);
  await writeFile(join(root, 'a.txt'), 'source');
  const unsupported = await convert({path:'a.txt'}, root, async()=> '# A');
  assert.equal(unsupported.success, false);
  await writeFile(join(root, 'a.pdf'), 'source');
  const forbidden = await convert({path:'a.pdf', output_dir:'elsewhere'}, root, async()=> '# A');
  assert.equal(forbidden.success, false);
});

test('passes explicit format to converter and maps AnyDoc errors', async () => {
  const root = await mkdtemp(join(tmpdir(), 'anydoc-'));
  await writeFile(join(root, 'a.bin'), 'source');
  let seen: string | undefined;
  const success = await convert({path:'a.bin', format:'.CSV'}, root, async (_path, format) => { seen = format; return 'table'; });
  assert.equal(success.success, true);
  assert.equal(seen, 'csv');
  const failure = await convert({path:'a.bin', format:'csv'}, root, async () => { throw Object.assign(new Error('scanned'), {code:'needsOcr'}); });
  assert.equal(failure.success, false);
  if (!failure.success) assert.equal(failure.error.code, 'OCR_REQUIRED');
});

test('conversion failures leave no Markdown file and empty results fail', async () => {
  const root = await mkdtemp(join(tmpdir(), 'anydoc-'));
  await writeFile(join(root, 'a.pdf'), 'source');
  const params = { path: 'a.pdf', output_dir: '.pi/anydoc-tmp/' };
  const failure = await convert(params, root, async () => { throw Object.assign(new Error('broken'), { code: 'malformed' }); });
  assert.equal(failure.success, false);
  if (!failure.success) assert.equal(failure.error.code, 'MALFORMED_FILE');
  assert.deepEqual(await readdir(join(root, '.pi', 'anydoc-tmp')), []);
  const empty = await convert({ path: 'a.pdf' }, root, async () => '   ');
  assert.equal(empty.success, false);
  if (!empty.success) assert.equal(empty.error.code, 'EMPTY_RESULT');
});
