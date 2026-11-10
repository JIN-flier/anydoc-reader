import assert from 'node:assert/strict';
import test from 'node:test';
import { mkdtemp, mkdir, readFile, symlink } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { resolveInputPath, resolveOutputDirectory, saveMarkdown } from '../src/filesystem.ts';

test('resolves input paths against workspace', async () => {
  assert.equal(resolveInputPath('/work', 'a.pdf'), '/work/a.pdf');
  assert.equal(resolveInputPath('/work', '/outside/a.pdf'), '/outside/a.pdf');
});

test('saves unique files in the permitted directory without overwriting', async () => {
  const root = await mkdtemp(join(tmpdir(), 'anydoc-'));
  const dir = await resolveOutputDirectory(root, '.pi/anydoc-tmp/');
  const first = await saveMarkdown(dir, '/work/report.pdf', '# One');
  const second = await saveMarkdown(dir, '/work/report.pdf', '# Two');
  assert.notEqual(first, second);
  assert.equal(await readFile(first, 'utf8'), '# One');
  assert.equal(await readFile(second, 'utf8'), '# Two');
});

test('rejects traversal and symlink output directories', async () => {
  const root = await mkdtemp(join(tmpdir(), 'anydoc-'));
  await assert.rejects(resolveOutputDirectory(root, '../elsewhere'));
  await mkdir(join(root, '.pi'));
  await symlink(tmpdir(), join(root, '.pi', 'anydoc-tmp'));
  await assert.rejects(resolveOutputDirectory(root, '.pi/anydoc-tmp/'));
});

test('rejects a symlinked .pi parent before creating output', async () => {
  const root = await mkdtemp(join(tmpdir(), 'anydoc-'));
  const outside = await mkdtemp(join(tmpdir(), 'anydoc-outside-'));
  await symlink(outside, join(root, '.pi'));
  await assert.rejects(resolveOutputDirectory(root, '.pi/anydoc-tmp/'));
  assert.deepEqual(await import('node:fs/promises').then(fs => fs.readdir(outside)), []);
});
