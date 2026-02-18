/**
 * Servidor API Express para Trident Agent.
 *
 * Endpoints:
 * - GET /token?connection=... — genera token cifrado para guacamole-lite y registra la sesión en data/data.csv.
 * - GET /sessions — lista de sesiones desde el CSV (connectionName, sessionId, videoPath, typescriptPath).
 * - GET /view-log?sessionId=... — sirve el archivo typescript de la sesión (texto plano).
 * - GET /view-video?sessionId=... — sirve el archivo .guac de la sesión.
 * - POST /clean-recordings — vacía data/recordings y data/typescript.
 *
 * Integra guacamole-lite (WebSocket + guacd) para que el frontend obtenga el token y abra la conexión.
 */

const crypto = require('crypto');
const express = require('express');
const fs = require('fs');
const GuacamoleLite = require('guacamole-lite');
const path = require('path');
const config = require('./config');

/** Ruta al archivo CSV de sesiones (data/data.csv). Resuelta desde src/api/ → dos niveles arriba = raíz del proyecto. */
const DATA_CSV_PATH = path.join(__dirname, '..', '..', 'data', 'data.csv');

/** Primera línea del CSV: nombres de columnas. */
const CSV_HEADER = 'connectionName,sessionId,videoPath,typescriptPath\n';

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

/** Cabecera fija para que el JSON de sesiones siempre tenga las mismas claves. */
const CSV_COLUMNS = ['connectionName', 'sessionId', 'videoPath', 'typescriptPath'];

/**
 * Lee el CSV de sesiones y devuelve un array de objetos con connectionName, sessionId, videoPath, typescriptPath.
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

const app = express();
const PORT = 3417;

app.use(express.json());

/**
 * Cifra un objeto como token para guacamole-lite. Formato compatible: base64(cipher) y iv en base64.
 * @param {object} value - Objeto a cifrar (configuración de conexión).
 * @returns {string} Token en base64.
 */
function encryptToken(value) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(config.CRYPT_KEY), iv);

  let encryptedPayload = cipher.update(JSON.stringify(value), 'utf8', 'base64');
  encryptedPayload += cipher.final('base64');

  const data = {
    iv: iv.toString('base64'),
    value: encryptedPayload
  };

  return Buffer.from(JSON.stringify(data)).toString('base64');
}

const websocketOptions = {
  port: config.WEBSOCKET_PORT
};

const guacdOptions = {
  port: config.GUACD_PORT
};

const clientOptions = {
  crypt: {
    cypher: config.CIPHER,
    key: config.CRYPT_KEY
  }
};

const guacServer = new GuacamoleLite(websocketOptions, guacdOptions, clientOptions);

app.get('/token', (req, res) => {
  const connectionName = req.query.connection;
  const baseConfig = config.connections[connectionName];
  if (!baseConfig) {
    return res.status(400).json({ error: 'Unknown connection: ' + connectionName });
  }

  const connectionConfig = JSON.parse(JSON.stringify(baseConfig));
  const sessionId = crypto.randomUUID();

  const connectionType = connectionConfig.connection.type;
  let videoPath = null;
  let typescriptPath = null;

  if (['rdp', 'vnc'].includes(connectionType)) {
    connectionConfig.connection.settings['recording-path'] = config.RECORDINGS_PATH;
    connectionConfig.connection.settings['recording-name'] = `${sessionId}.guac`;
    connectionConfig.connection.settings['create-recording-path'] = 'true';
    videoPath = path.join(config.RECORDING_PATH_HOST, `${sessionId}.guac`);
  }
  if (connectionType === 'ssh') {
    connectionConfig.connection.settings['typescript-path'] = config.TYPESCRIPT_PATH;
    connectionConfig.connection.settings['typescript-name'] = `${sessionId}.typescript`;
    connectionConfig.connection.settings['create-typescript-path'] = 'true';
    typescriptPath = path.join(config.TYPESCRIPT_PATH_HOST, `${sessionId}.typescript`);
  }

  appendSessionToCsv(connectionName, sessionId, videoPath, typescriptPath);

  const token = encryptToken(connectionConfig);
  res.json({ token });
});

app.get('/sessions', (req, res) => {
  const sessions = readSessionsFromCsv();
  res.json(sessions);
});

/**
 * Busca una sesión por sessionId en el CSV.
 * @param {string} sessionId - Identificador de la sesión.
 * @returns {{ connectionName: string, sessionId: string, videoPath: string, typescriptPath: string } | undefined}
 */
function findSessionBySessionId(sessionId) {
  const sessions = readSessionsFromCsv();
  return sessions.find((s) => (s.sessionId || '').trim() === String(sessionId).trim());
}

/**
 * Resuelve la ruta real del primer archivo que exista en la lista de candidatas.
 * @param {string[]} filePathCandidates - Lista de rutas a probar (pueden ser relativas o absolutas).
 * @returns {string|null} Ruta absoluta del archivo existente o null si ninguna existe.
 */
function resolveFilePath(filePathCandidates) {
  for (const candidatePath of filePathCandidates) {
    const resolvedPath = candidatePath ? path.resolve(candidatePath) : '';
    if (resolvedPath && fs.existsSync(resolvedPath)) return resolvedPath;
  }
  return null;
}

/**
 * Borra todos los archivos dentro de una carpeta (solo primer nivel; no borra subdirectorios).
 * @param {string} dirPath - Ruta del directorio.
 * @returns {number} Número de archivos eliminados.
 */
function clearDirectory(dirPath) {
  if (!dirPath || !fs.existsSync(dirPath)) return 0;
  const resolvedDirPath = path.resolve(dirPath);
  let count = 0;
  const entries = fs.readdirSync(resolvedDirPath, { withFileTypes: true });
  for (const entry of entries) {
    if (entry.isFile()) {
      fs.unlinkSync(path.join(resolvedDirPath, entry.name));
      count++;
    }
  }
  return count;
}

/** GET /view-log?sessionId=... — devuelve el contenido del log de texto (typescript) de la sesión. */
app.get('/view-log', (req, res) => {
  const sessionId = (req.query.sessionId || '').trim();
  if (!sessionId) return res.status(400).send('Falta sessionId');
  const session = findSessionBySessionId(sessionId);
  const typescriptPathFromCsv = session && (session.typescriptPath || '').trim();
  const filePath = resolveFilePath([
    typescriptPathFromCsv,
    path.join(config.TYPESCRIPT_PATH_HOST, `${sessionId}.typescript`),
    path.join(config.TYPESCRIPT_PATH_HOST, `${sessionId}.txt`)
  ]);
  if (!filePath) return res.status(404).send('Archivo no encontrado');
  res.setHeader('Content-Type', 'text/plain; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.sendFile(filePath);
});

/** GET /view-video?sessionId=... — sirve el archivo .guac de la sesión (descarga o reproducción). */
app.get('/view-video', (req, res) => {
  const sessionId = (req.query.sessionId || '').trim();
  if (!sessionId) return res.status(400).send('Falta sessionId');
  const session = findSessionBySessionId(sessionId);
  const videoPathFromCsv = session && (session.videoPath || '').trim();
  const filePath = resolveFilePath([
    videoPathFromCsv,
    path.join(config.RECORDING_PATH_HOST, `${sessionId}.guac`)
  ]);
  if (!filePath) return res.status(404).send('Archivo no encontrado');
  res.setHeader('Content-Type', 'application/octet-stream');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.sendFile(filePath);
});

/** POST /clean-recordings — vacía las carpetas data/recordings y data/typescript. */
app.post('/clean-recordings', (req, res) => {
  const recordingsDir = config.RECORDING_PATH_HOST;
  const typescriptDir = config.TYPESCRIPT_PATH_HOST;
  const deletedRecordings = clearDirectory(recordingsDir);
  const deletedTypescript = clearDirectory(typescriptDir);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.json({
    ok: true,
    deletedRecordings,
    deletedTypescript,
    message: `Eliminados ${deletedRecordings} archivo(s) en recordings y ${deletedTypescript} en typescript.`
  });
});

/**
 * Inicia el servidor HTTP de la API en el puerto configurado.
 * @returns {Promise<import('http').Server>}
 */
function startApi() {
  return new Promise((resolve) => {
    const server = app.listen(PORT, () => {
      console.log(`API escuchando en http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

module.exports = { startApi, app, PORT };
