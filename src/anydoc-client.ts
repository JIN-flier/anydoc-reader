import { readFile } from 'node:fs/promises';
import { PluginError } from './errors.ts';

export async function convertWithAnyDoc(path: string, format?: string): Promise<string> {
  let anydoc: typeof import('@firecrawl/anydoc');
  try {
    anydoc = await import('@firecrawl/anydoc');
  } catch (error) {
    throw new PluginError('DEPENDENCY_ERROR', error instanceof Error ? error.message : 'Could not load AnyDoc.');
  }
  if (!format) return anydoc.toMarkdown(path);
  const bytes = await readFile(path);
  return anydoc.toMarkdownBytes(bytes, format as Parameters<typeof anydoc.toMarkdownBytes>[1]);
}
