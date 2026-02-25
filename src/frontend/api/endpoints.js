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

/** GET /api/v1/sessions/active */
export async function fetchActiveSessions() {
  const { data } = await apiClient.get(`${API_V1}/sessions/active`);
  return data;
}

/** DELETE /api/v1/sessions/active/:sessionId */
export async function forceCloseSession(sessionId) {
  const { data } = await apiClient.delete(`${API_V1}/sessions/active/${encodeURIComponent(sessionId)}`);
  return data;
}

/** GET /api/v1/internal/logs */
export async function fetchInternalLogs({ level, search, limit = 200 } = {}) {
  const params = { limit }; 
  if (level) params.level = level;//si se pasa level, se incluye en params; si no, no se incluye, lo que permite que el backend aplique su valor predeterminado (WARN,ERROR)
  if (search) params.search = search;//si se pasa search, se incluye en params; si no, no se incluye, lo que permite que el backend aplique su valor predeterminado (sin filtro)
  const { data } = await apiClient.get(`${API_V1}/internal/logs`, { params });
  return data;
}

/** DELETE /api/v1/internal/logs */
export async function cleanLogs() {
  const { data } = await apiClient.delete(`${API_V1}/internal/logs`);
  return data;
}

/** GET /api/v1/internal/status */
export async function fetchInternalStatus() {
  const { data } = await apiClient.get(`${API_V1}/internal/status`);
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
