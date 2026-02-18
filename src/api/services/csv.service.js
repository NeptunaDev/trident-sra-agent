/**
 * Servicio de lectura y escritura del CSV de sesiones (data/data.csv).
 *
 * Formato: connectionName,sessionId,videoPath,typescriptPath
 * Proporciona funciones para añadir filas, leer todas las sesiones y buscar por sessionId.
 */

const fs = require('fs');
const path = require('path');

/** Ruta al archivo CSV de sesiones. Resuelta desde src/api/services/ → tres niveles arriba = raíz del proyecto. */
const DATA_CSV_PATH = path.join(__dirname, '..', '..', '..', 'data', 'data.csv');

/** Primera línea del CSV: nombres de columnas. */
const CSV_HEADER = 'connectionName,sessionId,videoPath,typescriptPath\n';

/** Cabecera fija para que el JSON de sesiones siempre tenga las mismas claves. */
const CSV_COLUMNS = ['connectionName', 'sessionId', 'videoPath', 'typescriptPath'];

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
  const row = [connectionName, sessionId, video, typescript].map(escapeCsvField).join(',') + '\n';
  fs.appendFileSync(DATA_CSV_PATH, row);
}

/**
 * Lee el CSV de sesiones y devuelve un array de objetos normalizados.
 * Si la primera línea no es cabecera (connectionName, sessionId), se trata como datos (fallback).
 * @returns {Array<{ connectionName: string, sessionId: string, videoPath: string, typescriptPath: string }>}
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
 * @returns {{ connectionName: string, sessionId: string, videoPath: string, typescriptPath: string } | undefined}
 */
function findSessionBySessionId(sessionId) {
  const sessions = readSessionsFromCsv();
  return sessions.find((s) => (s.sessionId || '').trim() === String(sessionId).trim());
}

module.exports = {
  appendSessionToCsv,
  readSessionsFromCsv,
  findSessionBySessionId,
  CSV_COLUMNS,
};
