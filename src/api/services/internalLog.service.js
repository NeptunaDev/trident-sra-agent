const logBuffer = require('./logBuffer');

function addLog(level, message) {
  return logBuffer.addLog(level, message);
}

function getLogs({ level, limit = 200 } = {}) {
  const levelFilter = [];

  if (Array.isArray(level)) {
    levelFilter.push(...level);
  } else if (typeof level === 'string' && level.trim()) {
    levelFilter.push(...level.split(',').map((value) => value.trim()));
  }

  return logBuffer.getLogs(limit, levelFilter);
}

function clearLogs() {
  logBuffer.clear();
}

module.exports = {
  addLog,
  getLogs,
  clearLogs,
};
