/**
 * Servicio de lectura y escritura del CSV de sesiones (data/data.csv).
 *
 * Formato: connectionName,sessionId,videoPath,typescriptPath,createdAt
 * createdAt = ISO 8601 con milisegundos (ej. 2026-02-17T21:30:45.123Z).
 */

const fs = require('fs');
const path = require('path');

/** Ruta al archivo CSV de sesiones. Resuelta desde src/api/services/ → tres niveles arriba = raíz del proyecto. */
const DATA_CSV_PATH = path.join(__dirname, '..', '..', '..', 'data', 'data.csv');

/** Primera línea del CSV: nombres de columnas. */
const CSV_HEADER = 'connectionName,sessionId,videoPath,typescriptPath,createdAt\n';

/** Cabecera fija para que el JSON de sesiones siempre tenga las mismas claves. */
const CSV_COLUMNS = ['connectionName', 'sessionId', 'videoPath', 'typescriptPath', 'createdAt'];

/**
 * Escapa un valor para CSV (comillas si contiene coma, comilla o salto de línea).
 * @param {string} value - Valor del campo.
 * @returns {string}
 */
function escapeCsvField(value) {
  const s = String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/**
 * Parsea una línea CSV respetando comillas (campos entre comillas pueden contener comas).
 * @param {string} line - Línea de texto CSV.
 * @returns {string[]} Array de campos.
 */
function parseCsvLine(line) {
  const fields = [];
  let currentField = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') { currentField += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (inQuotes) {
      currentField += char;
    } else if (char === ',') {
      fields.push(currentField);
      currentField = '';
    } else {
      currentField += char;
    }
  }
  fields.push(currentField);
  return fields;
}

/**
 * Añade una fila al CSV de sesiones. Crea el directorio y el archivo con cabecera si no existen.
 * @param {string} connectionName - Nombre de la conexión (ej. 'ubuntu-vnc').
 * @param {string} sessionId - Identificador único de la sesión (UUID).
 * @param {string|null} videoPath - Ruta del archivo .guac o null si no aplica.
 * @param {string|null} typescriptPath - Ruta del archivo .typescript o null si no aplica.
 */
function appendSessionToCsv(connectionName, sessionId, videoPath, typescriptPath) {
  const csvDir = path.dirname(DATA_CSV_PATH);
  if (!fs.existsSync(csvDir)) fs.mkdirSync(csvDir, { recursive: true });
  if (!fs.existsSync(DATA_CSV_PATH)) fs.writeFileSync(DATA_CSV_PATH, CSV_HEADER);
  const video = videoPath != null ? String(videoPath) : '';
  const typescript = typescriptPath != null ? String(typescriptPath) : '';
  const createdAt = new Date().toISOString();
  const row = [connectionName, sessionId, video, typescript, createdAt].map(escapeCsvField).join(',') + '\n';
  fs.appendFileSync(DATA_CSV_PATH, row);
}

/**
 * Lee el CSV de sesiones y devuelve un array de objetos normalizados.
 * Si la primera línea no es cabecera (connectionName, sessionId), se trata como datos (fallback).
 * Filas antiguas sin createdAt quedan con createdAt ''.
 * @returns {Array<{ connectionName: string, sessionId: string, videoPath: string, typescriptPath: string, createdAt: string }>}
 */
function readSessionsFromCsv() {
  if (!fs.existsSync(DATA_CSV_PATH)) return [];
  const text = fs.readFileSync(DATA_CSV_PATH, 'utf8');
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];

  const headerFields = parseCsvLine(lines[0]);
  const hasRealHeader = headerFields[0] === 'connectionName' && headerFields[1] === 'sessionId';
  const dataStartIndex = hasRealHeader ? 1 : 0;

  const rows = [];
  for (let i = dataStartIndex; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row = {};
    CSV_COLUMNS.forEach((col, j) => {
      row[col] = values[j] != null ? String(values[j]).trim() : '';
    });
    rows.push(row);
  }
  return rows;
}

/**
 * Busca una sesión por sessionId en el CSV.
 * @param {string} sessionId - Identificador de la sesión.
 * @returns {{ connectionName: string, sessionId: string, videoPath: string, typescriptPath: string, createdAt: string } | undefined}
 */
function findSessionBySessionId(sessionId) {
  const sessions = readSessionsFromCsv();
  return sessions.find((s) => (s.sessionId || '').trim() === String(sessionId).trim());
}

/**
 * Vacía el CSV de sesiones: deja solo la cabecera (todas las filas eliminadas).
 */
function truncateSessionsCsv() {
  const csvDir = path.dirname(DATA_CSV_PATH);
  if (!fs.existsSync(csvDir)) fs.mkdirSync(csvDir, { recursive: true });
  fs.writeFileSync(DATA_CSV_PATH, CSV_HEADER);
}

/**
 * Elimina del CSV la fila de la sesión con el sessionId indicado.
 * Reescribe el archivo con el resto de filas.
 * @param {string} sessionId - Identificador de la sesión a quitar.
 * @returns {boolean} True si se encontró y eliminó la fila.
 */
function removeSessionBySessionId(sessionId) {
  const sessions = readSessionsFromCsv();
  const id = String(sessionId).trim();
  const filtered = sessions.filter((s) => (s.sessionId || '').trim() !== id);
  if (filtered.length === sessions.length) return false;
  const csvDir = path.dirname(DATA_CSV_PATH);
  if (!fs.existsSync(csvDir)) fs.mkdirSync(csvDir, { recursive: true });
  const lines = [CSV_HEADER.trim()];
  filtered.forEach((row) => {
    const video = (row.videoPath != null ? String(row.videoPath) : '').trim();
    const typescript = (row.typescriptPath != null ? String(row.typescriptPath) : '').trim();
    const createdAt = (row.createdAt != null ? String(row.createdAt) : '').trim();
    const rowLine = [row.connectionName, row.sessionId, video, typescript, createdAt].map(escapeCsvField).join(',');
    lines.push(rowLine);
  });
  fs.writeFileSync(DATA_CSV_PATH, lines.join('\n') + '\n');
  return true;
}

module.exports = {
  appendSessionToCsv,
  readSessionsFromCsv,
  findSessionBySessionId,
  truncateSessionsCsv,
  removeSessionBySessionId,
  CSV_COLUMNS,
};
