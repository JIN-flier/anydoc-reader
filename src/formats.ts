export const formats = [
  { name: 'Word', extensions: ['.doc', '.docx'] },
  { name: 'Excel', extensions: ['.xls', '.xlsx'] },
  { name: 'PowerPoint', extensions: ['.ppt', '.pptx'] },
  { name: 'PDF', extensions: ['.pdf'] },
  { name: 'OpenDocument', extensions: ['.odt'] },
  { name: 'RTF', extensions: ['.rtf'] },
  { name: 'EPUB', extensions: ['.epub'] },
  { name: 'CSV', extensions: ['.csv'] },
] as const;

const supported = new Set<string>(formats.flatMap(group => group.extensions.map(ext => ext.slice(1))));

export function normalizeFormat(value: string): string | null {
  const normalized = value.trim().toLowerCase().replace(/^\./, '');
  return supported.has(normalized) ? normalized : null;
}
