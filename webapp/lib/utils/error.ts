import { isString } from 'es-toolkit';

/**
 * 에러 메시지 추출 — any 대신 unknown 처리 (es-toolkit isString 활용)
 */
export function getErrorMessage(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (isString(err)) return err;
  if (err && typeof err === 'object' && 'message' in err && isString((err as { message: unknown }).message)) {
    return (err as { message: string }).message;
  }
  return '알 수 없는 오류가 발생했습니다';
}
