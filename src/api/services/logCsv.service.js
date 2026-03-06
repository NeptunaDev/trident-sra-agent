/** 
 * Servicio de lectura y escritura del csv de logs de sesiones (data/logs.csv).
 * Formato: sessionId,logType,logMessage,createdAt
 * 
 */
const fs = require('fs');
const path = require('path');

/** Ruta al archivo CSV de logs de sesiones. Resuelta desde src/api/services/ → tres niveles arriba = raíz del proyecto. */
const LOGS_CSV_PATH = path.join(__dirname, '..', '..', '..', 'data', 'logs.csv');

/** Primera línea del CSV de logs: nombres de columnas. */
const CSV_LOG_HEADER = 'sessionId,logType,logMessage,createdAt\n';

/** Cabecera fija para que el JSON de logs siempre tenga las mismas claves. */
const CSV_LOG_COLUMNS = ['sessionId', 'logType', 'logMessage', 'createdAt'];

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
 * Añade una fila al CSV de logs de sesiones. Crea el directorio y el archivo con cabecera si no existen.
 * @param {string} sessionId - ID de la sesión (ej. '123e4567-e89b-12d3-a456-426614174000').
 * @param {string} logType - Tipo de log (ej. 'INFO', 'WARN', 'ERROR').
 * @param {string} logMessage - Mensaje del log.
 * @param {string} createdAt - Fecha y hora de creación del log (ej. '2024-06-01T12:34:56Z').
 * 
 */
function appendLogToCsv(sessionId, logType, logMessage, createdAt) {
      const csvDir = path.dirname(LOGS_CSV_PATH);
      if (!fs.existsSync(csvDir)) fs.mkdirSync(csvDir, { recursive: true });
      if (!fs.existsSync(LOGS_CSV_PATH)) fs.writeFileSync(LOGS_CSV_PATH, CSV_LOG_HEADER);
      const createdAtValue = createdAt != null ? String(createdAt) : new Date().toISOString();
      const row = [ sessionId, logType, logMessage, createdAtValue].map(escapeCsvField).join(',') + '\n';
      fs.appendFileSync(LOGS_CSV_PATH, row);
    }

/**
 * lee el CSV de logs de sesiones y devuelve un array de objetos con los logs de una sesión específica.
 * Si la primera linea no es cabecera(sessionId,logType,logMessage,createdAt) se trata como una fila de datos normal.
 * @returns {Array<{ sessionId: string, logType: string, logMessage: string, createdAt: string }>}
 * */

function readAllLogsFromCsv() {
 if (!fs.existsSync(LOGS_CSV_PATH)) return [];
 const text = fs.readFileSync(LOGS_CSV_PATH, 'utf-8');
 const lines = text.split(/\r?\n/).filter((l) => l.trim());
 if (!lines.length) return [];
 const headerFields = parseCsvLine(lines[0]);
 const hasRealHeader = headerFields[0] === 'sessionId' && headerFields[1] === 'logType' && headerFields[2] === 'logMessage' && headerFields[3] === 'createdAt';
 const dataStartIndex = hasRealHeader ? 1 : 0;

 const rows = [];

 for (let i=dataStartIndex;i<lines.length;i++) {
    const values = parseCsvLine(lines[i]);
    const row={};
    CSV_LOG_COLUMNS.forEach((col, j) => {
      row[col] = values[j] != null ? String(values[j]).trim() : '';
    });
    rows.push(row);
  }
    return rows;
}

/**
 * Busca los logs por sessionId en el CSV.
 * @param {string} sessionId - ID de la sesión a buscar.
 * @return {Array<{ sessionId: string, logType: string, logMessage: string, createdAt: string }>} Array de logs encontrados para la sesión.
 */

function findLogsBySessionId(sessionId) {
    const allLogs = readAllLogsFromCsv();
    return allLogs.filter(log => log.sessionId.trim() === String(sessionId).trim());
}

/**
 * Elimina del csv de logs de sesiones todas las filas TODAS(menos la cabecera)
 */
function truncateSessionLogsCsv() {
    const csvDir = path.dirname(LOGS_CSV_PATH);
    if (fs.existsSync(LOGS_CSV_PATH)) {
        fs.writeFileSync(LOGS_CSV_PATH, CSV_LOG_HEADER);
    }
}

/**
 * elimina del CSV la fila de la sesión con el sessionId indicado.
 * reescribe el archivo con el resto de filas
 * @param {string} sessionId - ID de la sesión cuyos logs se quieren eliminar.
 * @return {boolean} true si la enctro u elimino la fila
 * 
 */

function removeLogsBySessionId(sessionId) {
    const allLogs = readAllLogsFromCsv();
  const id = String(sessionId).trim();
    const filtered = allLogs.filter(log => log.sessionId.trim() !== id);
    if (filtered.length === allLogs.length) return false;
    const csvDir = path.dirname(LOGS_CSV_PATH);
    if (!fs.existsSync(csvDir)) fs.mkdirSync(csvDir, { recursive: true });
    const lines = [CSV_LOG_HEADER.trim()];
    filtered.forEach((row) => {
        const logType = (row.logType != null ? String(row.logType) : '').trim();
        const logMessage = (row.logMessage != null ? String(row.logMessage) : '').trim();
        const createdAt = (row.createdAt != null ? String(row.createdAt) : '').trim();
        const sessionId = (row.sessionId != null ? String(row.sessionId) : '').trim();
        const rowLine = [sessionId, logType, logMessage, createdAt].map(escapeCsvField).join(',');
        lines.push(rowLine);
    });
    fs.writeFileSync(LOGS_CSV_PATH, lines.join('\n') + '\n');
    return true;
}

module.exports = {
    appendLogToCsv,
    readAllLogsFromCsv,
    findLogsBySessionId,
    truncateSessionLogsCsv,
    removeLogsBySessionId,
    CSV_LOG_COLUMNS,
};