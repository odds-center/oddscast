/**
 * Server-only API fetch — for use in Node environments like getServerSideProps
 * Does not use browser's axiosInstance (localStorage, etc.)
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

/** If response is wrapped in { data }, return data; otherwise return body as-is */
function unwrap<T>(body: { data?: T } | T): T {
  if (body && typeof body === 'object' && 'data' in body) return (body as { data: T }).data;
  return body as T;
}

export interface ServerFetchOptions {
  params?: Record<string, string | number | undefined>;
  /** Pass cookies (use context.req.headers.cookie when authentication is required) */
  cookie?: string;
}

/**
 * GET request — for calling public APIs in SSR
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
