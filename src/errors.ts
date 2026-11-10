export type ErrorCode = 'FILE_NOT_FOUND' | 'FILE_NOT_READABLE' | 'UNSUPPORTED_FORMAT' | 'INVALID_FORMAT' | 'ANYDOC_ERROR' | 'OCR_REQUIRED' | 'MALFORMED_FILE' | 'ENCRYPTED_FILE' | 'OUTPUT_PATH_FORBIDDEN' | 'OUTPUT_WRITE_FAILED' | 'EMPTY_RESULT' | 'DEPENDENCY_ERROR';

export class PluginError extends Error {
  readonly code: ErrorCode;
  readonly causeCode?: string;
  constructor(code: ErrorCode, message: string, causeCode?: string) {
    super(message);
    this.name = 'PluginError';
    this.code = code;
    this.causeCode = causeCode;
  }
}

export function normalizeError(error: unknown): { code: ErrorCode; message: string; cause_code?: string } {
  if (error instanceof PluginError) return { code: error.code, message: error.message, ...(error.causeCode ? { cause_code: error.causeCode } : {}) };
  const record = error && typeof error === 'object' ? error as { code?: unknown; message?: unknown } : {};
  const causeCode = typeof record.code === 'string' ? record.code : undefined;
  const codeMap: Record<string, ErrorCode> = {
    needsOcr: 'OCR_REQUIRED', malformed: 'MALFORMED_FILE', missingPart: 'MALFORMED_FILE',
    encrypted: 'ENCRYPTED_FILE', unsupported: 'UNSUPPORTED_FORMAT', io: 'FILE_NOT_READABLE',
  };
  const code = causeCode ? codeMap[causeCode] ?? 'ANYDOC_ERROR' : 'ANYDOC_ERROR';
  const message = typeof record.message === 'string' && record.message ? record.message : String(error);
  return { code, message, ...(causeCode ? { cause_code: causeCode } : {}) };
}
