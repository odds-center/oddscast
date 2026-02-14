/**
 * API 응답 BigInt 직렬화 — Prisma chaksunT 등 BigInt 필드를 JSON 호환 형태로 변환
 */
export function serializeBigInt<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return obj;
  }
  if (typeof obj === 'bigint') {
    return String(obj) as T;
  }
  if (typeof obj !== 'object') {
    return obj;
  }
  if (obj instanceof Date) {
    return obj;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => serializeBigInt(item)) as T;
  }
  const result: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    result[key] = serializeBigInt(value);
  }
  return result as T;
}
