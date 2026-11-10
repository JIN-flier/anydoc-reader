import type { ExtensionAPI } from '@earendil-works/pi-coding-agent';
import { Type } from 'typebox';
import { convert } from './tools/convert.ts';
import { listFormats } from './tools/formats.ts';

export default function anydocRead(pi: ExtensionAPI): void {
  pi.registerTool({
    name: 'anydoc_convert',
    label: 'Convert document to Markdown',
    description: 'Convert a local document to Markdown. Without output_dir returns Markdown; with .pi/anydoc-tmp/ saves a file for selective reading.',
    parameters: Type.Object({
      path: Type.String({ description: 'Local document path, relative to the workspace or absolute' }),
      output_dir: Type.Optional(Type.String({ description: 'Only .pi/anydoc-tmp/ is allowed' })),
      format: Type.Optional(Type.String({ description: 'Optional supported input extension, with or without dot' })),
    }),
    async execute(_id, params, _signal, _update, ctx) {
      const result = await convert(params, ctx.cwd);
      return { content: [{ type: 'text', text: JSON.stringify(result) }], details: result };
    },
  });

  pi.registerTool({
    name: 'anydoc_formats',
    label: 'Supported document formats',
    description: 'List the document extensions accepted by anydoc_convert.',
    parameters: Type.Object({}),
    async execute() {
      const result = listFormats();
      return { content: [{ type: 'text', text: JSON.stringify(result) }], details: result };
    },
  });
}
