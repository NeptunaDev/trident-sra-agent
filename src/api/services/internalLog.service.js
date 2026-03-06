const logCsvService = require('./logCsv.Service');
let visibleFromTimestamp = null;

function normalizeLevel(level) {
  const value = String(level || 'INFO').trim().toUpperCase();
  if (value === 'WARN' || value === 'ERROR' || value === 'INFO') return value;
  return 'INFO';
}

function addLog(level, message, sessionId = 'system') {
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    level: normalizeLevel(level),
    message: String(message || ''),
    timestamp: new Date().toISOString(),
    sessionId: String(sessionId || 'system').trim() || 'system',
  };

  try {
    logCsvService.appendLogToCsv(entry.sessionId, entry.level, entry.message, entry.timestamp);
  } catch (_error) {
  }

  return entry;
}

function getLogs({ level, limit = 200 } = {}) {
  const levelFilter = [];

  if (Array.isArray(level)) {
    levelFilter.push(...level);
  } else if (typeof level === 'string' && level.trim()) {
    levelFilter.push(...level.split(',').map((value) => value.trim()));
  }

  const normalizedLevels = levelFilter
    .map((value) => String(value || '').trim())
    .filter((value) => value && value.toUpperCase() !== 'ALL' && value.toLowerCase() !== 'undefined' && value.toLowerCase() !== 'null')
    .map((value) => normalizeLevel(value));
  const max = Math.max(1, Math.min(2000, Number(limit) || 200));

  return logCsvService
    .readAllLogsFromCsv()
    .slice()
    .reverse()
    .map((row, index) => ({
      id: `${row.createdAt || 'ts'}-${index}`,
      level: normalizeLevel(row.logType),
      message: String(row.logMessage || ''),
      timestamp: row.createdAt || '',
      sessionId: String(row.sessionId || '').trim(),
    }))
    .filter((entry) => {
      if (!visibleFromTimestamp) return true;
      const parsed = Date.parse(entry.timestamp);
      if (Number.isNaN(parsed)) return false;
      return parsed >= visibleFromTimestamp;
    })
    .filter((entry) => !normalizedLevels.length || normalizedLevels.includes(entry.level))
    .slice(0, max);
}

function clearLogs() {
  visibleFromTimestamp = Date.now();
}

module.exports = {
  addLog,
  getLogs,
  clearLogs,
};
