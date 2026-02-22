import { isString } from 'es-toolkit';

/**
 * Extract error message — uses unknown instead of any (utilizes es-toolkit isString)
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (isString(err)) return err;
  if (err && typeof err === 'object' && 'message' in err && isString((err as { message: unknown }).message)) {
    return (err as { message: string }).message;
  }
  return '알 수 없는 오류가 발생했습니다';
}
