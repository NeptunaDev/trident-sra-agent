const net = require('net');
const config = require('../config');
const logBuffer = require('../services/logBuffer');
const agentEmitter = require('../services/eventEmitter');

let lastGuacdStatus = null;

function probeGuacd(host, port, timeoutMs = 1000) { // Intenta conectar a guacd para verificar si está operativo. Resuelve true si la conexión es exitosa, false si falla o agota el tiempo.
  return new Promise((resolve) => {
    const socket = new net.Socket();
    let settled = false;

    const finish = (ok) => {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(ok);
    };

    socket.setTimeout(timeoutMs);
    socket.once('connect', () => finish(true));
    socket.once('timeout', () => finish(false));
    socket.once('error', () => finish(false));
    socket.connect(port, host);
  });
}

function getLogs(req, res) {
  const { level, limit, search } = req.query;
  const levels = (Array.isArray(level) ? level : [level]) // Convierte level en array si no lo es
    .flatMap((value) => String(value).split(','))
    .map((value) => value.trim())
    .filter(Boolean);

  const searchValue = String(search || '').trim().toLowerCase();// Si se proporciona search, filtra los logs para incluir solo aquellos cuyo mensaje contenga el valor de búsqueda 
  const logs = logBuffer
    .getLogs(limit, levels)
    .filter((entry) => !searchValue || String(entry.message).toLowerCase().includes(searchValue));

  res.json({ logs });
}

function deleteLogs(_req, res) {
  logBuffer.clear();
  res.json({ ok: true });
}

async function getStatus(_req, res) {
  const guacdOk = await probeGuacd(config.GUACD_HOST, config.GUACD_PORT);

  if (lastGuacdStatus !== guacdOk) {
    if (guacdOk) {
      const message = 'Conexión con guacd restablecida';
      logBuffer.addLog('INFO', message);
    } else {
      const message = 'Error de conexión con guacd';
      logBuffer.addLog('ERROR', message);
      agentEmitter.emit('agent:error', { message });
    }
    lastGuacdStatus = guacdOk;
  }

  res.json({
    apiPort: 3417,
    wsPort: config.WEBSOCKET_PORT,
    apiOk: true,
    wsOk: true,
    guacdOk,
  });
}

module.exports = {
  getLogs,
  deleteLogs,
  getStatus,
};
