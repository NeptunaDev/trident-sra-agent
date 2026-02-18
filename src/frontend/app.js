/**
 * Cliente Guacamole en el renderer (Electron).
 *
 * Gestiona conexiones remotas VNC, SSH y RDP vía el servidor WebSocket de guacamole-lite:
 * obtiene un token de la API, abre el túnel, dibuja el display en #display y reenvía
 * eventos de ratón y teclado al cliente remoto.
 */
import Guacamole from './vendor/guacamole-common.js';

/** Instancia del cliente Guacamole; null cuando no hay sesión activa. */
let client = null;

/** Teclado global: reenvía keydown/keyup al cliente remoto salvo cuando el foco está en un input. */
let keyboard = null;

/**
 * Indica si el foco está en un campo de texto (input, textarea o contenteditable).
 * En ese caso no se envían las teclas al remoto para poder escribir en formularios locales.
 * @returns {boolean}
 */
function isTextInputFocused() {
  const el = document.activeElement;
  if (!el) return false;
  const tag = el.tagName && el.tagName.toLowerCase();
  if (tag === 'input' || tag === 'textarea') return true;
  return el.isContentEditable === true;
}

if (!keyboard) {
  keyboard = new Guacamole.Keyboard(document);

  keyboard.onkeydown = (keysym) => {
    if (!client || isTextInputFocused()) return true;
    client.sendKeyEvent(1, keysym);
    return false;
  };

  keyboard.onkeyup = (keysym) => {
    if (!client || isTextInputFocused()) return true;
    client.sendKeyEvent(0, keysym);
    return false;
  };
}

/**
 * Inicia el cliente Guacamole con el token recibido de la API.
 * Crea el túnel WebSocket (puerto 8080), monta el display en #display y enlaza
 * los eventos de ratón para reenviarlos al escritorio remoto.
 * @param {string} token - Token cifrado de conexión (generado por GET /token?connection=...)
 */
async function startClient(token) {
  const encodeUri = `ws://localhost:8080/?token=${encodeURIComponent(token)}`;
  const tunnel = new Guacamole.WebSocketTunnel(encodeUri);
  client = new Guacamole.Client(tunnel);

  const display = document.getElementById('display');
  display.innerHTML = '';
  const element = client.getDisplay().getElement();
  display.appendChild(element);

  const mouse = new Guacamole.Mouse(element);
  mouse.onmousedown = mouse.onmouseup = mouse.onmousemove = (state) => {
    if (client) client.sendMouseState(state);
  };

  client.connect();
}

const API_BASE = `http://localhost:${(typeof window !== 'undefined' && window.electronAPI?.getApiPort?.()) || '3417'}`;

/** Normaliza un objeto de sesión por si las claves vienen con otro nombre. */
function normalizeSession(row) {
  return {
    connectionName: row.connectionName ?? row.connection_name ?? '',
    sessionId: row.sessionId ?? row.session_id ?? '',
    videoPath: row.videoPath ?? row.video_path ?? '',
    typescriptPath: row.typescriptPath ?? row.typescript_path ?? ''
  };
}

/** Trunca texto largo y pone el completo en title. */
function cellWithTitle(text, maxLen = 40) {
  const s = String(text || '').trim();
  if (!s) return { short: '—', title: '' };
  return { short: s.length > maxLen ? s.slice(0, maxLen) + '…' : s, title: s };
}

/**
 * Obtiene las sesiones del endpoint /sessions y rellena la tabla.
 */
async function loadSessionsTable() {
  const tbody = document.getElementById('sessions-tbody');
  const emptyEl = document.getElementById('sessions-empty');
  if (!tbody || !emptyEl) return;
  try {
    const res = await fetch(`${API_BASE}/sessions`);
    const data = await res.json();
    const sessions = Array.isArray(data) ? data : [];
    tbody.innerHTML = '';
    if (sessions.length === 0) {
      emptyEl.classList.add('visible');
      return;
    }
    emptyEl.classList.remove('visible');
    sessions.forEach((row) => {
      const s = normalizeSession(row);
      const conn = escapeHtml(s.connectionName || '—');
      const sid = escapeHtml(s.sessionId);
      const vid = cellWithTitle(s.videoPath);
      const typ = cellWithTitle(s.typescriptPath);
      const hasVideo = (s.videoPath || '').trim().length > 0;
      const hasText = (s.typescriptPath || '').trim().length > 0;
      const tr = document.createElement('tr');
      tr.dataset.sessionId = s.sessionId;
      tr.innerHTML = `
        <td class="cell-connection">${conn}</td>
        <td class="cell-session"><code title="${escapeHtml(sid)}">${escapeHtml(sid)}</code></td>
        <td class="cell-path" title="${escapeHtml(vid.title)}">${escapeHtml(vid.short === '—' ? '—' : 'Sí')}</td>
        <td class="cell-path" title="${escapeHtml(typ.title)}">${escapeHtml(typ.short === '—' ? '—' : 'Sí')}</td>
        <td class="cell-actions">
          <button type="button" class="btn-cell btn-video" ${hasVideo ? '' : 'disabled'} title="Ver grabación">Ver video</button>
          <button type="button" class="btn-cell btn-text" ${hasText ? '' : 'disabled'} title="Ver log de texto">Ver texto</button>
        </td>
      `;
      tbody.appendChild(tr);
    });
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="5" class="cell-error">Error al cargar sesiones</td></tr>';
    emptyEl.classList.remove('visible');
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Muestra u oculta el panel (botones + tabla) según si hay sesión activa.
 */
function setConnected(connected) {
  const app = document.querySelector('.app');
  if (app) app.classList.toggle('connected', connected);
}

/**
 * Obtiene un token de conexión de la API y arranca el cliente con él.
 * @param {string} nameConnection - Clave de conexión en config (ej. 'ubuntu-vnc', 'ubuntu-ssh', 'windows-rdp')
 */
async function connect(nameConnection) {
  const token = await fetch(`${API_BASE}/token?connection=${encodeURIComponent(nameConnection)}`);
  const data = await token.json();
  await startClient(data.token);
  setConnected(true);
}

/**
 * Cierra la sesión Guacamole, libera el cliente y limpia el área #display.
 */
async function disconnect() {
  if (client) {
    client.disconnect();
    client = null;
  }
  const display = document.getElementById('display');
  display.innerHTML = '';
  setConnected(false);
  await loadSessionsTable();
}

/** Abre popup con el log typescript de la sesión (texto plano, estilo terminal). */
async function openLogPopup(sessionId) {
  try {
    const res = await fetch(`${API_BASE}/view-log?sessionId=${encodeURIComponent(sessionId)}`);
    const text = await res.text();
    const w = window.open('', '_blank', 'width=800,height=560,scrollbars=yes,resizable=yes');
    if (!w) return;
    const safe = escapeHtml(text) || '(vacío)';
    const lines = safe.split('\n').length;
    const lineNumbers = Array.from({ length: lines }, (_, i) => i + 1).join('\n');
    w.document.write(`
      <!DOCTYPE html><html><head><meta charset="utf-8"><title>Typescript ${escapeHtml(sessionId)}</title>
      <style>
        *{box-sizing:border-box;}
        body{margin:0;background:#0f172a;color:#e2e8f0;font:13px/1.5 "SF Mono",Monaco,Consolas,monospace;}
        .log-header{padding:0.5rem 1rem;background:#1e293b;border-bottom:1px solid #334155;color:#94a3b8;font-size:0.85rem;}
        .log-wrap{display:flex;overflow:auto;padding:0;min-height:calc(100vh - 36px);}
        .line-nums{padding:0.75rem 0.5rem;background:#1e293b;color:#64748b;text-align:right;user-select:none;border-right:1px solid #334155;}
        .log-content{padding:0.75rem 1rem;white-space:pre-wrap;word-break:break-all;flex:1;}
      </style></head>
      <body>
        <div class="log-header">Session ${escapeHtml(sessionId)} — Typescript log</div>
        <div class="log-wrap"><pre class="line-nums">${escapeHtml(lineNumbers)}</pre><pre class="log-content">${safe}</pre></div>
      </body></html>
    `);
    w.document.close();
  } catch (e) {
    alert('No se pudo cargar el log.');
  }
}

/** Instancia del reproductor de grabación .guac (SessionRecording); null si no hay modal abierto. */
let reproductor = null;

/**
 * Abre el modal y reproduce la grabación .guac en la interfaz.
 * Flujo: StaticHTTPTunnel(view-video URL) → SessionRecording(tunnel) → display en #video-display,
 * onresize para scale(), connect() y play(). Datos de sesión vienen del CSV (GET /sessions, GET /view-video).
 */
function abrirReproductor(sessionId) {
  const display = document.getElementById('video-display');
  const modal = document.getElementById('modal-video');
  if (!display || !modal) return;
  display.innerHTML = '';

  const videoUrl = `${API_BASE}/view-video?sessionId=${encodeURIComponent(sessionId)}`;
  const tunnel = new Guacamole.StaticHTTPTunnel(videoUrl);
  reproductor = new Guacamole.SessionRecording(tunnel);

  const playerDisplay = reproductor.getDisplay();
  const playerElement = playerDisplay.getElement();
  display.appendChild(playerElement);

  playerDisplay.onresize = (width, height) => {
    if (!width || !height) return;
    const scale = Math.min(display.clientWidth / width, 600 / height);
    playerDisplay.scale(scale);
  };

  modal.classList.remove('hidden');
  reproductor.connect();
  setTimeout(() => {
    if (reproductor) reproductor.play();
  }, 1000);
}

/** Cierra el modal del reproductor: pausa, desconecta y oculta. */
function cerrarVideo() {
  if (reproductor) {
    reproductor.pause();
    reproductor.disconnect();
    reproductor = null;
  }
  const modal = document.getElementById('modal-video');
  if (modal) modal.classList.add('hidden');
}

/** Abre el reproductor de grabación .guac en el modal (mismo flujo que el doc, con CSV). */
function openVideoPopup(sessionId) {
  abrirReproductor(sessionId);
}

function onSessionActionClick(e) {
  const btn = e.target.closest('.btn-video, .btn-text');
  if (!btn || btn.disabled) return;
  const tr = e.target.closest('tr');
  const sessionId = tr && tr.dataset.sessionId;
  if (!sessionId) return;
  if (btn.classList.contains('btn-video')) openVideoPopup(sessionId);
  else openLogPopup(sessionId);
}

document.getElementById('btn-vnc').addEventListener('click', () => connect('ubuntu-vnc'));
document.getElementById('btn-ssh').addEventListener('click', () => connect('ubuntu-ssh'));
document.getElementById('btn-rdp').addEventListener('click', () => connect('windows-rdp'));
document.getElementById('btn-disconnect').addEventListener('click', disconnect);

const sessionsTbody = document.getElementById('sessions-tbody');
if (sessionsTbody) sessionsTbody.addEventListener('click', onSessionActionClick);

document.getElementById('btn-play-video').addEventListener('click', () => { if (reproductor) reproductor.play(); });
document.getElementById('btn-pause-video').addEventListener('click', () => { if (reproductor) reproductor.pause(); });
document.getElementById('btn-seek-video').addEventListener('click', () => { if (reproductor) reproductor.seek(0); });
document.getElementById('btn-close-video').addEventListener('click', cerrarVideo);
document.querySelector('.modal-backdrop[data-action="close"]')?.addEventListener('click', cerrarVideo);

loadSessionsTable();
