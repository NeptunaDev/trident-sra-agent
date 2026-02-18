const crypto = require('crypto');
const express = require('express');
const fs = require('fs');
const GuacamoleLite = require('guacamole-lite');
const path = require('path');
const config = require('./config');

/** data/data.csv (resuelto desde src/api/ → dos niveles arriba = raíz del proyecto). */
const DATA_CSV_PATH = path.join(__dirname, '..', '..', 'data', 'data.csv');
const CSV_HEADER = 'connectionName,sessionId,videoPath,typescriptPath\n';

function appendSessionToCsv(connectionName, sessionId, videoPath, typescriptPath) {
  const dir = path.dirname(DATA_CSV_PATH);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(DATA_CSV_PATH)) fs.writeFileSync(DATA_CSV_PATH, CSV_HEADER);
  const video = videoPath != null ? String(videoPath) : '';
  const typescript = typescriptPath != null ? String(typescriptPath) : '';
  const row = [connectionName, sessionId, video, typescript].map(escapeCsvField).join(',') + '\n';
  fs.appendFileSync(DATA_CSV_PATH, row);
}

function escapeCsvField(value) {
  const s = String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

/** Parsea una línea CSV respetando comillas (campos entre comillas pueden contener comas). */
function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') {
      if (inQuotes && line[i + 1] === '"') { cur += '"'; i++; }
      else inQuotes = !inQuotes;
    } else if (inQuotes) {
      cur += c;
    } else if (c === ',') {
      out.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  out.push(cur);
  return out;
}

/** Cabecera fija para que el JSON siempre tenga las mismas claves. */
const CSV_COLUMNS = ['connectionName', 'sessionId', 'videoPath', 'typescriptPath'];

/** Devuelve el contenido del CSV como array de objetos con connectionName, sessionId, videoPath, typescriptPath. */
function readSessionsFromCsv() {
  if (!fs.existsSync(DATA_CSV_PATH)) return [];
  const text = fs.readFileSync(DATA_CSV_PATH, 'utf8');
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];

  const header = parseCsvLine(lines[0]);
  const hasRealHeader = header[0] === 'connectionName' && header[1] === 'sessionId';
  const startIndex = hasRealHeader ? 1 : 0;

  const rows = [];
  for (let i = startIndex; i < lines.length; i++) {
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

/** Cifra el payload; formato compatible con guacamole-lite (base64 desde cipher, iv en base64). */
function encryptToken(value) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(config.CRYPT_KEY), iv);

  let encrypted = cipher.update(JSON.stringify(value), 'utf8', 'base64');
  encrypted += cipher.final('base64');

  const data = {
    iv: iv.toString('base64'),
    value: encrypted
  };

  return Buffer.from(JSON.stringify(data)).toString('base64');
}

const websocketOptions = {
  port: config.WEBSOCKET_PORT // WebSocket server port
};

const guacdOptions = {
  port: config.GUACD_PORT // guacd server port
};

const clientOptions = {
  crypt: {
    cypher: config.CIPHER,
    key: config.CRYPT_KEY // Use a secure key
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
  // connectionConfig.additionalProperties.sessionId = sessionId;

  const type = connectionConfig.connection.type;
  let videoPath = null;
  let typescriptPath = null;

  if (['rdp', 'vnc'].includes(type)) {
    connectionConfig.connection.settings['recording-path'] = config.RECORDINGS_PATH;
    connectionConfig.connection.settings['recording-name'] = `${sessionId}.guac`;
    connectionConfig.connection.settings['create-recording-path'] = 'true';
    videoPath = path.join(config.RECORDING_PATH_HOST, `${sessionId}.guac`);
  }
  if (type === 'ssh') {
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

/** Busca una sesión por sessionId en el CSV. */
function findSessionBySessionId(sessionId) {
  const sessions = readSessionsFromCsv();
  return sessions.find((s) => (s.sessionId || '').trim() === String(sessionId).trim());
}

/** Resuelve la ruta real del archivo: prueba la del CSV y luego por sessionId en las carpetas configuradas. */
function resolveFilePath(candidates) {
  for (const p of candidates) {
    const resolved = p ? path.resolve(p) : '';
    if (resolved && fs.existsSync(resolved)) return resolved;
  }
  return null;
}

/** Borra todos los archivos dentro de una carpeta (solo primer nivel). Devuelve número de archivos borrados. */
function clearDirectory(dirPath) {
  if (!dirPath || !fs.existsSync(dirPath)) return 0;
  const resolved = path.resolve(dirPath);
  let count = 0;
  const entries = fs.readdirSync(resolved, { withFileTypes: true });
  for (const ent of entries) {
    if (ent.isFile()) {
      fs.unlinkSync(path.join(resolved, ent.name));
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

function startApi() {
  return new Promise((resolve) => {
    const server = app.listen(PORT, () => {
      console.log(`API escuchando en http://localhost:${PORT}`);
      resolve(server);
    });
  });
}

module.exports = { startApi, app, PORT };
