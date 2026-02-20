/**
 * 서버 전용 API fetch — getServerSideProps 등 Node 환경에서 사용
 * 브라우저의 axiosInstance(localStorage 등)를 쓰지 않음
 */

const getBaseUrl = () =>
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

function buildUrl(path: string, params?: Record<string, string | number | undefined>): string {
  const base = getBaseUrl().replace(/\/$/, '');
  const p = path.startsWith('/') ? path : `/${path}`;
  const url = `${base}${p}`;
  if (!params || Object.keys(params).length === 0) return url;
  const search = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => {
    if (v !== undefined && v !== '') search.set(k, String(v));
  });
  const q = search.toString();
  return q ? `${url}?${q}` : url;
}

/** 응답이 { data } 래핑이면 data 반환, 아니면 body 그대로 */
function unwrap<T>(body: { data?: T } | T): T {
  if (body && typeof body === 'object' && 'data' in body) return (body as { data: T }).data;
  return body as T;
}

export interface ServerFetchOptions {
  params?: Record<string, string | number | undefined>;
  /** 쿠키 전달 (인증 필요 시 context.req.headers.cookie) */
  cookie?: string;
}

/**
 * GET 요청 — SSR에서 공개 API 호출용
 */
export async function serverGet<T>(
  path: string,
  options: ServerFetchOptions = {},
): Promise<T> {
  const { params, cookie } = options;
  const url = buildUrl(path, params);
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (cookie) headers.Cookie = cookie;

  const res = await fetch(url, {
    method: 'GET',
    headers,
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API ${res.status}: ${text || res.statusText}`);
  }

  const json = (await res.json()) as { data?: T } | T;
  return unwrap(json) as T;
}
