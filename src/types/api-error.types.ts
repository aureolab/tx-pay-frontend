export interface ApiError {
  statusCode: number;
  message: string | string[];
  error?: string;
}

export function getErrorMessage(err: unknown): string {
  if (typeof err === 'object' && err !== null && 'response' in err) {
    const response = (err as { response?: { data?: ApiError } }).response;
    const msg = response?.data?.message;
    if (Array.isArray(msg)) return msg.join(', ');
    if (typeof msg === 'string') return msg;
  }
  if (err instanceof Error) return err.message;
  return 'An unexpected error occurred';
}
