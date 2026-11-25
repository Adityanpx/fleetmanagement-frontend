const BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

function authHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
}

interface ValidationDetail { path?: string; msg?: string }

async function handle(res: Response) {
  if (res.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem('token');
    // Outside React there is no router; a full reload also clears all cached SWR data.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    if (!window.location.pathname.startsWith('/login')) window.location.href = '/login';
  }
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    // express-validator errors arrive as { error: 'Validation failed', details: [{ path, msg }] }
    const details = Array.isArray(data.details) ? (data.details as ValidationDetail[]) : [];
    const fields = details.map((d) => d.path).filter(Boolean);
    const msg = data.error || 'Request failed';
    throw new Error(fields.length ? `${msg}: ${[...new Set(fields)].join(', ')}` : msg);
  }
  return data;
}

function request(method: string, path: string, body?: unknown) {
  const hasBody = method !== 'GET' && method !== 'DELETE';
  return fetch(`${BASE}/api${path}`, {
    method,
    headers: { ...(hasBody ? { 'Content-Type': 'application/json' } : {}), ...authHeaders() },
    body: hasBody ? JSON.stringify(body ?? {}) : undefined,
  })
    .catch(() => { throw new Error('Cannot reach the server. Is the backend running?'); })
    .then(handle);
}

export const api = {
  get: (path: string) => request('GET', path),
  post: (path: string, body?: unknown) => request('POST', path, body),
  put: (path: string, body?: unknown) => request('PUT', path, body),
  patch: (path: string, body?: unknown) => request('PATCH', path, body),
  del: (path: string) => request('DELETE', path),
};

export const fetcher = (path: string) => api.get(path);
