import { apiClient, getApiV1Base, API_V1 } from './client';

/** GET /api/v1/sessions?page=&limit= */
export async function fetchSessions(page = 1, limit = 10) {
  const { data } = await apiClient.get(`${API_V1}/sessions`, { params: { page, limit } });
  return data;
}

/** GET /api/v1/guacamole/token?connection= */
export async function fetchToken(connection) {
  const { data } = await apiClient.get(`${API_V1}/guacamole/token`, { params: { connection } });
  return data;
}

/** DELETE /api/v1/sessions/:sessionId */
export async function deleteSession(sessionId) {
  const { data } = await apiClient.delete(`${API_V1}/sessions/${encodeURIComponent(sessionId)}`);
  return data;
}

/** POST /api/v1/sessions/clean-recordings */
export async function cleanRecordings() {
  const { data } = await apiClient.post(`${API_V1}/sessions/clean-recordings`);
  return data;
}

/** URL para GET /api/v1/view/log?sessionId= (para abrir en ventana o fetch texto) */
export function getViewLogUrl(sessionId) {
  return `${getApiV1Base()}/view/log?sessionId=${encodeURIComponent(sessionId)}`;
}

/** URL para GET /api/v1/view/video?sessionId= (usada por Guacamole.StaticHTTPTunnel) */
export function getViewVideoUrl(sessionId) {
  return `${getApiV1Base()}/view/video?sessionId=${encodeURIComponent(sessionId)}`;
}
