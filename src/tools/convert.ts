import { extname } from 'node:path';
import { convertWithAnyDoc } from '../anydoc-client.ts';
import { normalizeError, PluginError } from '../errors.ts';
import { checkInput, resolveInputPath, resolveOutputDirectory, saveMarkdown } from '../filesystem.ts';
import { normalizeFormat } from '../formats.ts';

export interface ConvertParams { path: string; output_dir?: string; format?: string }
export type ConvertResult =
  | { success: true; mode: 'inline'; source_path: string; format: string; markdown: string }
  | { success: true; mode: 'file'; source_path: string; format: string; markdown_path: string }
  | { success: false; error: ReturnType<typeof normalizeError> };
export type Converter = (path: string, format?: string) => Promise<string>;

export async function convert(params: ConvertParams, workspace: string, converter: Converter = convertWithAnyDoc): Promise<ConvertResult> {
  try {
    if (!params.path?.trim()) throw new PluginError('FILE_NOT_FOUND', 'Input path is required.');
    const source = resolveInputPath(workspace, params.path);
    await checkInput(source);
    const explicit = params.format === undefined ? undefined : normalizeFormat(params.format);
    if (explicit === null) throw new PluginError('INVALID_FORMAT', 'Specified format is unsupported.');
    const format = explicit ?? normalizeFormat(extname(source));
    if (!format) throw new PluginError('UNSUPPORTED_FORMAT', 'Input file format is unsupported.');
    const output = params.output_dir === undefined ? undefined : await resolveOutputDirectory(workspace, params.output_dir);
    const markdown = await converter(source, explicit);
    if (!markdown?.trim()) throw new PluginError('EMPTY_RESULT', 'Conversion produced no Markdown.');
    if (!output) return { success: true, mode: 'inline', source_path: source, format, markdown };
    const markdown_path = await saveMarkdown(output, source, markdown);
    return { success: true, mode: 'file', source_path: source, format, markdown_path };
  } catch (error) {
    return { success: false, error: normalizeError(error) };
  }
}
