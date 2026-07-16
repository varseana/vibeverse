// ---------------------------------------------------------------------------
// API client
// ---------------------------------------------------------------------------
// Single seam between the UI and the data source. Today it talks to the local
// mock store (localStorage). When the real backend lands, flip VITE_API_BASE
// (and set MODE='http') and every call goes to API Gateway + Lambda instead,
// with the Midway id_token attached as a Bearer token. The UI never changes.
//
// Endpoint shapes are frozen here so the backend contract is defined up front:
//   GET    /me                       -> { login, role }
//   GET    /content/:section         -> [ ...items ]
//   POST   /content/:section         -> item        (admin)
//   PUT    /content/:section/:id     -> item        (admin)
//   DELETE /content/:section/:id     -> { ok: true } (admin)
//   GET    /rewards                  -> [ ...nominations ]
//   POST   /rewards                  -> nomination   (sepo_manager+)
// sections: flyers | news | links | events
// ---------------------------------------------------------------------------

const MODE = import.meta.env.VITE_API_BASE ? 'http' : 'mock'
const BASE = import.meta.env.VITE_API_BASE || ''

// The Midway id_token is injected by the auth layer once real SSO is wired.
// For now it stays null and the mock path ignores it.
let authToken = null
export function setAuthToken(t) { authToken = t }

async function http(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(authToken ? { Authorization: `Bearer ${authToken}` } : {}),
    },
    credentials: 'include', // Midway cookie fallback if the edge handles auth
    body: body ? JSON.stringify(body) : undefined,
  })
  if (res.status === 401) throw new ApiError('No autenticado', 401)
  if (res.status === 403) throw new ApiError('Sin permisos', 403)
  if (!res.ok) throw new ApiError(`Error ${res.status}`, res.status)
  return res.status === 204 ? null : res.json()
}

export class ApiError extends Error {
  constructor(message, status) { super(message); this.status = status }
}

export const isHttpMode = () => MODE === 'http'

// Thin wrappers used by the store / pages. In mock mode the store handles the
// data directly and these are unused; they exist so swapping to HTTP is trivial.
export const api = {
  me: () => http('GET', '/me'),
  list: (section) => http('GET', `/content/${section}`),
  create: (section, item) => http('POST', `/content/${section}`, item),
  update: (section, id, patch) => http('PUT', `/content/${section}/${id}`, patch),
  remove: (section, id) => http('DELETE', `/content/${section}/${id}`),
  listRewards: () => http('GET', '/rewards'),
  createReward: (item) => http('POST', '/rewards', item),
}
