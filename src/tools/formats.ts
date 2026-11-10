import { formats } from '../formats.ts';

export function listFormats() {
  return { formats: formats.map(group => ({ name: group.name, extensions: [...group.extensions] })) };
}
