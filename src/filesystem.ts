import { access, lstat, mkdir, open, realpath, stat, unlink } from 'node:fs/promises';
import { constants } from 'node:fs';
import { randomBytes } from 'node:crypto';
import { basename, extname, isAbsolute, join, resolve } from 'node:path';
import { PluginError } from './errors.ts';

export function resolveInputPath(workspace: string, input: string): string {
  return resolve(workspace, input);
}

export async function checkInput(path: string): Promise<void> {
  try {
    const info = await stat(path);
    if (!info.isFile()) throw new PluginError('FILE_NOT_READABLE', 'Input is not a regular file.');
    await access(path, constants.R_OK);
  } catch (error) {
    if (error instanceof PluginError) throw error;
    const code = (error as NodeJS.ErrnoException).code;
    throw new PluginError(code === 'ENOENT' ? 'FILE_NOT_FOUND' : 'FILE_NOT_READABLE', code === 'ENOENT' ? 'Input file does not exist.' : 'Input file cannot be read.');
  }
}

export async function resolveOutputDirectory(workspace: string, requested: string): Promise<string> {
  const root = await realpath(workspace);
  const allowed = join(root, '.pi', 'anydoc-tmp');
  const requestedPath = isAbsolute(requested) ? resolve(requested) : resolve(root, requested);
  if (requestedPath !== allowed) throw new PluginError('OUTPUT_PATH_FORBIDDEN', 'Output directory must be the workspace .pi/anydoc-tmp/ directory.');
  try {
    for (const directory of [join(root, '.pi'), allowed]) {
      let info;
      try {
        info = await lstat(directory);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== 'ENOENT') throw error;
        await mkdir(directory);
        info = await lstat(directory);
      }
      if (!info.isDirectory() || info.isSymbolicLink()) throw new PluginError('OUTPUT_PATH_FORBIDDEN', 'Output directory contains a symbolic link or non-directory component.');
    }
    if (await realpath(allowed) !== allowed) throw new PluginError('OUTPUT_PATH_FORBIDDEN', 'Output directory contains a symbolic link.');
    return allowed;
  } catch (error) {
    if (error instanceof PluginError) throw error;
    throw new PluginError('OUTPUT_WRITE_FAILED', 'Cannot create output directory.');
  }
}

export async function saveMarkdown(directory: string, source: string, markdown: string): Promise<string> {
  const stem = basename(source, extname(source)).replace(/[^\p{L}\p{N}._-]/gu, '_').slice(0, 80) || 'document';
  for (let attempt = 0; attempt < 5; attempt++) {
    const destination = join(directory, `${stem}-${randomBytes(6).toString('hex')}.md`);
    let handle;
    try {
      handle = await open(destination, 'wx', 0o600);
      await handle.writeFile(markdown, 'utf8');
      await handle.close();
      return destination;
    } catch (error) {
      await handle?.close().catch(() => {});
      if ((error as NodeJS.ErrnoException).code === 'EEXIST') continue;
      await unlink(destination).catch(() => {});
      throw new PluginError('OUTPUT_WRITE_FAILED', 'Failed to save Markdown.');
    }
  }
  throw new PluginError('OUTPUT_WRITE_FAILED', 'Could not allocate a unique Markdown filename.');
}
