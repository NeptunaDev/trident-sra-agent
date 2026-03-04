const MAX_ENTRIES = 200;

const entries = new Array(MAX_ENTRIES);
let writeIndex = 0;
let size = 0;

function normalizeLevel(level) {
  const value = String(level || 'INFO').trim().toUpperCase();
  // Solo permite WARN, ERROR o INFO. Cualquier otra cosa la convierte en INFO
  if (value === 'WARN' || value === 'ERROR' || value === 'INFO') return value;
  return 'INFO';
}

function addLog(level, message) {
  const entry = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    level: normalizeLevel(level),
    message: String(message || ''),
    timestamp: new Date().toISOString(),
  };

  entries[writeIndex] = entry;// guarda la nueva entrada en el índice actual
  writeIndex = (writeIndex + 1) % MAX_ENTRIES;
  if (size < MAX_ENTRIES) size += 1;// aumenta el tamaño si no se ha alcanzado el máximo

  return entry;
}

// Devuelve las entradas más recientes primero, hasta el límite solicitado, y opcionalmente filtradas por nivel.
function getAllNewestFirst() {
  const result = [];
  for (let offset = 0; offset < size; offset += 1) {
    const index = (writeIndex - 1 - offset + MAX_ENTRIES) % MAX_ENTRIES;
    const entry = entries[index];
    if (entry) result.push(entry);
  }
  return result;
}

function getLogs(limit = 200, levelFilter = []) {
  const max = Math.max(1, Math.min(MAX_ENTRIES, Number(limit) || 200));

  //normaliza los filtros recibidos (ej: ['warn', 'error']).
  const normalizedLevels = Array.isArray(levelFilter)
    ? levelFilter.map((value) => normalizeLevel(value)).filter(Boolean)
    : [];

  return getAllNewestFirst()
    .filter((entry) => !normalizedLevels.length || normalizedLevels.includes(entry.level))//filtra por nivel si se proporcionó alguno
    .slice(0, max);
}

function clear() {
  entries.fill(undefined);
  writeIndex = 0;
  size = 0;
}

module.exports = {
  MAX_ENTRIES,
  addLog,
  getLogs,
  clear,
};