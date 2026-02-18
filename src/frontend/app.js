/**
 * Cliente Guacamole en el renderer (Electron).
 *
 * Gestiona conexiones remotas VNC, SSH y RDP vía el servidor WebSocket de guacamole-lite:
 * obtiene un token de la API, abre el túnel, dibuja el display en #display y reenvía
 * eventos de ratón y teclado al cliente remoto. También carga la tabla de sesiones desde
 * GET /sessions, y permite ver grabaciones .guac en un modal y logs typescript en un popup.
 */

import Guacamole from './vendor/guacamole-common.js';

/** Instancia del cliente Guacamole (conexión en vivo). Null cuando no hay sesión activa. */
let client = null;

/** Teclado global: reenvía keydown/keyup al cliente remoto salvo cuando el foco está en un input. */
let keyboard = null;

/**
 * Indica si el foco está en un campo de texto (input, textarea o contenteditable).
 * En ese caso no se envían las teclas al remoto para poder escribir en formularios locales.
 * @returns {boolean}
 */
function isTextInputFocused() {
  const activeElement = document.activeElement;
  if (!activeElement) return false;
  const tagName = activeElement.tagName && activeElement.tagName.toLowerCase();
  if (tagName === 'input' || tagName === 'textarea') return true;
  return activeElement.isContentEditable === true;
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
  const webSocketUrl = `ws://localhost:8080/?token=${encodeURIComponent(token)}`;
  const tunnel = new Guacamole.WebSocketTunnel(webSocketUrl);
  client = new Guacamole.Client(tunnel);

  const display = document.getElementById('display');
  display.innerHTML = '';
  const displayElement = client.getDisplay().getElement();
  display.appendChild(displayElement);

  const mouse = new Guacamole.Mouse(displayElement);
  mouse.onmousedown = mouse.onmouseup = mouse.onmousemove = (state) => {
    if (client) client.sendMouseState(state);
  };

  client.connect();
}

/** URL base de la API (ej. http://localhost:3417). Se obtiene del preload (electronAPI.getApiPort()). */
const API_BASE = `http://localhost:${(typeof window !== 'undefined' && window.electronAPI?.getApiPort?.()) || '3417'}`;

/**
 * Normaliza un objeto de sesión por si las claves vienen con otro nombre (snake_case vs camelCase).
 * @param {object} row - Objeto crudo de sesión (del CSV o API).
 * @returns {{ connectionName: string, sessionId: string, videoPath: string, typescriptPath: string }}
 */
function normalizeSession(row) {
  return {
    connectionName: row.connectionName ?? row.connection_name ?? '',
    sessionId: row.sessionId ?? row.session_id ?? '',
    videoPath: row.videoPath ?? row.video_path ?? '',
    typescriptPath: row.typescriptPath ?? row.typescript_path ?? ''
  };
}

/**
 * Trunca texto largo para mostrar en celda y deja el texto completo para el atributo title.
 * @param {string} text - Texto a mostrar.
 * @param {number} maxLen - Longitud máxima antes de truncar (por defecto 40).
 * @returns {{ short: string, title: string }}
 */
function cellWithTitle(text, maxLen = 40) {
  const str = String(text || '').trim();
  if (!str) return { short: '—', title: '' };
  return { short: str.length > maxLen ? str.slice(0, maxLen) + '…' : str, title: str };
}

/**
 * Obtiene las sesiones del endpoint GET /sessions y rellena la tabla #sessions-tbody.
 * Muestra u oculta el mensaje "No hay sesiones" según corresponda.
 */
async function loadSessionsTable() {
  const tbody = document.getElementById('sessions-tbody');
  const emptyEl = document.getElementById('sessions-empty');
  if (!tbody || !emptyEl) return;
  try {
    const response = await fetch(`${API_BASE}/sessions`);
    const sessionsData = await response.json();
    const sessions = Array.isArray(sessionsData) ? sessionsData : [];
    tbody.innerHTML = '';
    if (sessions.length === 0) {
      emptyEl.classList.add('visible');
      return;
    }
    emptyEl.classList.remove('visible');
    sessions.forEach((row) => {
      const session = normalizeSession(row);
      const connectionNameEscaped = escapeHtml(session.connectionName || '—');
      const sessionIdEscaped = escapeHtml(session.sessionId);
      const videoCellInfo = cellWithTitle(session.videoPath);
      const typescriptCellInfo = cellWithTitle(session.typescriptPath);
      const hasVideo = (session.videoPath || '').trim().length > 0;
      const hasText = (session.typescriptPath || '').trim().length > 0;
      const tr = document.createElement('tr');
      tr.dataset.sessionId = session.sessionId;
      tr.innerHTML = `
        <td class="cell-connection">${connectionNameEscaped}</td>
        <td class="cell-session"><code title="${escapeHtml(sessionIdEscaped)}">${escapeHtml(sessionIdEscaped)}</code></td>
        <td class="cell-path" title="${escapeHtml(videoCellInfo.title)}">${escapeHtml(videoCellInfo.short === '—' ? '—' : 'Sí')}</td>
        <td class="cell-path" title="${escapeHtml(typescriptCellInfo.title)}">${escapeHtml(typescriptCellInfo.short === '—' ? '—' : 'Sí')}</td>
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

/**
 * Escapa una cadena para insertar en HTML y evitar XSS.
 * @param {string} str - Texto a escapar.
 * @returns {string}
 */
function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/**
 * Muestra u oculta el panel de protocolos y la tabla de sesiones según si hay sesión activa.
 * Aplica la clase .connected al contenedor .app cuando connected es true.
 * @param {boolean} connected - True si hay una conexión Guacamole activa.
 */
function setConnected(connected) {
  const appEl = document.querySelector('.app');
  if (appEl) appEl.classList.toggle('connected', connected);
}

/**
 * Obtiene un token de conexión de la API y arranca el cliente Guacamole con él.
 * @param {string} nameConnection - Clave de conexión en config (ej. 'ubuntu-vnc', 'ubuntu-ssh', 'windows-rdp')
 */
async function connect(nameConnection) {
  const tokenResponse = await fetch(`${API_BASE}/token?connection=${encodeURIComponent(nameConnection)}`);
  const data = await tokenResponse.json();
  await startClient(data.token);
  setConnected(true);
}

/**
 * Cierra la sesión Guacamole, libera el cliente y limpia el área #display.
 * Vuelve a cargar la tabla de sesiones para reflejar el estado actual.
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

/**
 * Abre un popup con el log typescript de la sesión (texto plano, estilo terminal con números de línea).
 * @param {string} sessionId - Identificador de la sesión.
 */
async function openLogPopup(sessionId) {
  try {
    const response = await fetch(`${API_BASE}/view-log?sessionId=${encodeURIComponent(sessionId)}`);
    const text = await response.text();
    const popupWindow = window.open('', '_blank', 'width=800,height=560,scrollbars=yes,resizable=yes');
    if (!popupWindow) return;
    const escapedLogContent = escapeHtml(text) || '(vacío)';
    const lineCount = escapedLogContent.split('\n').length;
    const lineNumbers = Array.from({ length: lineCount }, (_, i) => i + 1).join('\n');
    popupWindow.document.write(`
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
        <div class="log-wrap"><pre class="line-nums">${escapeHtml(lineNumbers)}</pre><pre class="log-content">${escapedLogContent}</pre></div>
      </body></html>
    `);
    popupWindow.document.close();
  } catch (e) {
    alert('No se pudo cargar el log.');
  }
}

/** Instancia del reproductor de grabación .guac (Guacamole.SessionRecording). Null si no hay modal abierto. */
let sessionRecordingPlayer = null;

/**
 * Abre el modal de reproducción y reproduce la grabación .guac en #video-display.
 * Flujo: StaticHTTPTunnel(URL de view-video) → SessionRecording(tunnel) → display en #video-display,
 * onresize para scale(), connect() y play(). Los datos de sesión vienen del CSV (GET /sessions, GET /view-video).
 * @param {string} sessionId - Identificador de la sesión cuya grabación se va a reproducir.
 */
function abrirReproductor(sessionId) {
  const display = document.getElementById('video-display');
  const modal = document.getElementById('modal-video');
  if (!display || !modal) return;
  display.innerHTML = '';

  const videoUrl = `${API_BASE}/view-video?sessionId=${encodeURIComponent(sessionId)}`;
  const tunnel = new Guacamole.StaticHTTPTunnel(videoUrl);
  sessionRecordingPlayer = new Guacamole.SessionRecording(tunnel);

  const playerDisplay = sessionRecordingPlayer.getDisplay();
  const playerElement = playerDisplay.getElement();
  display.appendChild(playerElement);

  playerDisplay.onresize = (width, height) => {
    if (!width || !height) return;
    const scale = Math.min(display.clientWidth / width, 600 / height);
    playerDisplay.scale(scale);
  };

  modal.classList.remove('hidden');
  sessionRecordingPlayer.connect();
  setTimeout(() => {
    if (sessionRecordingPlayer) sessionRecordingPlayer.play();
  }, 1000);
}

/** Cierra el modal del reproductor: pausa, desconecta la grabación y oculta el modal. */
function cerrarVideo() {
  if (sessionRecordingPlayer) {
    sessionRecordingPlayer.pause();
    sessionRecordingPlayer.disconnect();
    sessionRecordingPlayer = null;
  }
  const modal = document.getElementById('modal-video');
  if (modal) modal.classList.add('hidden');
}

/**
 * Abre el reproductor de grabación .guac en el modal (wrapper que delega en abrirReproductor).
 * @param {string} sessionId - Identificador de la sesión.
 */
function openVideoPopup(sessionId) {
  abrirReproductor(sessionId);
}

/**
 * Manejador de clics en la tabla de sesiones: "Ver video" o "Ver texto".
 * Obtiene el sessionId del tr y llama a openVideoPopup o openLogPopup según el botón.
 * @param {MouseEvent} e - Evento de clic.
 */
function onSessionActionClick(e) {
  const btn = e.target.closest('.btn-video, .btn-text');
  if (!btn || btn.disabled) return;
  const row = e.target.closest('tr');
  const sessionId = row && row.dataset.sessionId;
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

document.getElementById('btn-play-video').addEventListener('click', () => { if (sessionRecordingPlayer) sessionRecordingPlayer.play(); });
document.getElementById('btn-pause-video').addEventListener('click', () => { if (sessionRecordingPlayer) sessionRecordingPlayer.pause(); });
document.getElementById('btn-seek-video').addEventListener('click', () => { if (sessionRecordingPlayer) sessionRecordingPlayer.seek(0); });
document.getElementById('btn-close-video').addEventListener('click', cerrarVideo);
document.querySelector('.modal-backdrop[data-action="close"]')?.addEventListener('click', cerrarVideo);

loadSessionsTable();
