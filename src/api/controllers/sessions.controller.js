/**
 * Controlador de GET /sessions.
 *
 * Devuelve sesiones del CSV ordenadas por fecha de creación (más reciente primero)
 * con paginación (page, limit). Respuesta: { sessions, pagination }.
 */

const csvService = require('../services/csv.service');
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

module.exports = {
  getSessions,
};
