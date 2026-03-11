/**
 * Controlador de GET /sessions.
 *
 * Devuelve sesiones del CSV ordenadas por fecha de creación (más reciente primero)
 * con paginación (page, limit). Respuesta: { sessions, pagination }.
 */

const csvService = require('../services/csv.service');
const config = require('../config');
const sessionManager = require('../services/sessionManager');
const internalLogService = require('../services/internalLog.service');
const agentEmitter = require('../services/eventEmitter');
const { forceCloseSession } = require('../guacamole');
const { DEFAULT_PAGE, DEFAULT_LIMIT } = require('../schemas/sessions.schema');

/**
 * GET /sessions?page=1&limit=10
 * Responde con { sessions: [...], pagination: { total, page, limit, totalPages } }.
 * @param {import('express').Request} req - req.query.page y req.query.limit opcionales.
 * @param {import('express').Response} res
 */
function getSessions(req, res) {
  const page = Math.max(1, parseInt(req.query.page, 10) || DEFAULT_PAGE);
  const limit = Math.min(50, Math.max(1, parseInt(req.query.limit, 10) || DEFAULT_LIMIT));

  let sessions = csvService.readSessionsFromCsv();

  sessions.sort((a, b) => {
    const dateA = (a.createdAt || '').trim();
    const dateB = (b.createdAt || '').trim();
    return dateB.localeCompare(dateA);
  });

  const total = sessions.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const start = (page - 1) * limit;
  const paginatedSessions = sessions.slice(start, start + limit);

  res.json({
    sessions: paginatedSessions,
    pagination: {
      total,
      page,
      limit,
      totalPages
    }
  });
}

/**
 * GET /sessions/active
 * Responde con el estado en tiempo real de sesiones activas.
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
function getActiveSessions(req, res) {
  const now = Date.now();
  const active = sessionManager.activeSessions().map((session) => {
    const startedAtMs = Date.parse(session.startedAt);
    const elapsedSeconds = Number.isNaN(startedAtMs)
      ? 0
      : Math.max(0, Math.floor((now - startedAtMs) / 1000));

    return {
      sessionId: session.sessionId,
      connectionId: session.connectionId,
      connectionType: session.connectionType,
      startedAt: session.startedAt,
      elapsedSeconds,
    };
  });

  res.json({
    active,
    count: sessionManager.count(),
    limit: config.MAX_CONCURRENT_SESSIONS,
  });
}

/**
 * DELETE /sessions/active/:sessionId
 * Cierre forzado de sesión activa (en memoria y WebSocket si existe conexión asociada).
 * @param {import('express').Request} req
 * @param {import('express').Response} res
 */
function deleteActiveSession(req, res) {
  const sessionId = req.params.sessionId.trim();
  const activeSession = sessionManager.getSession(sessionId);

  if (!activeSession) {
    return res.status(404).json({ error: 'Sesión activa no encontrada' });
  }

  const socketClosed = forceCloseSession(sessionId);
  const removed = sessionManager.closeSession(sessionId);

  if (removed) {
    internalLogService.addLog('INFO', `Sesión cerrada (sessionId=${sessionId})`, sessionId);
    agentEmitter.emit('session:ended', { sessionId });
  }

  return res.json({
    ok: removed,
    sessionId,
    socketClosed,
  });
}

module.exports = {
  getSessions,
  getActiveSessions,
  deleteActiveSession,
};
