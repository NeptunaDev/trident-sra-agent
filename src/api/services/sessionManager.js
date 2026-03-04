/**
 * Session Manager en memoria.
 *
 * Mantiene las sesiones activas de la aplicación mientras el proceso Node está encendido.
 * No persiste en disco: para historial se usa csv.service.js.
 * Formato: { sessionId, connectionId, connectionType, startedAt, clientConnection? }.
 */

const config = require('../config');

/** @type {Map<string, { sessionId: string, connectionId: string, connectionType: string, startedAt: string, clientConnection?: unknown }>} */
const activeSessionsMap = new Map();

/**
 * Límite máximo de sesiones concurrentes.
 * @returns {number}
 */
function getLimit() {
	const limit = Number(config.MAX_CONCURRENT_SESSIONS);
	if (!Number.isFinite(limit) || limit < 1) return 5;
	return Math.floor(limit);
}

/**
 * Devuelve todas las sesiones activas actuales.
 * @returns {Array<{ sessionId: string, connectionId: string, connectionType: string, startedAt: string, clientConnection?: unknown }>}
 */
function activeSessions() {
	return Array.from(activeSessionsMap.values());
}

/**
 * Registra o reemplaza una sesión activa.
 * @param {string} sessionId
 * @param {{ connectionId?: string, connectionType?: string, startedAt?: Date|string|number, clientConnection?: unknown }} data
 * @returns {{ sessionId: string, connectionId: string, connectionType: string, startedAt: string, clientConnection?: unknown }}
 */
function registerSession(sessionId, data = {}) {
	const normalizedSessionId = String(sessionId || '').trim();
	if (!normalizedSessionId) throw new Error('sessionId es obligatorio');
	const session = {
		sessionId: normalizedSessionId,
		connectionId: String(data.connectionId || '').trim(),
		connectionType: String(data.connectionType || '').trim(),
		startedAt: data.startedAt ? String(data.startedAt) : new Date().toISOString(),
	};

	if (data.clientConnection != null) {
		session.clientConnection = data.clientConnection;
	}

	activeSessionsMap.set(normalizedSessionId, session);
	return session;
}

/**
 * Cierra una sesión activa por id.
 * @param {string} sessionId
 * @returns {boolean} true si se eliminó; false si no existía.
 */
function closeSession(sessionId) {
	const normalizedSessionId = String(sessionId || '').trim();
	if (!normalizedSessionId) return false;
	return activeSessionsMap.delete(normalizedSessionId);
}

/**
 * Obtiene una sesión activa específica.
 * @param {string} sessionId
 * @returns {{ sessionId: string, connectionId: string, connectionType: string, startedAt: string, clientConnection?: unknown }|undefined}
 */
function getSession(sessionId) {
	const normalizedSessionId = String(sessionId || '').trim();
	if (!normalizedSessionId) return undefined;
	return activeSessionsMap.get(normalizedSessionId);
}

/**
 * Indica si se alcanzó el límite de sesiones concurrentes.
 * @returns {boolean}
 */
function isAtLimit() {
	return count() >= getLimit();
}

/**
 * Cantidad de sesiones activas.
 * @returns {number}
 */
function count() {
	return activeSessionsMap.size;
}

module.exports = {
	activeSessions,
	registerSession,
	closeSession,
	getSession,
	isAtLimit,
	count,
};

