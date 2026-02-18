/**
 * Cliente Guacamole en el renderer (Electron).
 *
 * Gestiona conexiones remotas VNC, SSH y RDP vía el servidor WebSocket de guacamole-lite:
 * obtiene un token de la API, abre el túnel, dibuja el display en #display y reenvía
 * eventos de ratón y teclado al cliente remoto. También carga la tabla de sesiones desde
 * GET /api/v1/sessions, y permite ver grabaciones .guac en un modal y logs typescript en un popup.
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
 * @param {string} token - Token cifrado de conexión (generado por GET /api/v1/guacamole/token?connection=...)
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

/** Prefijo de rutas de la API v1: /api/v1/{carpeta}/{endpoint}. */
const API_V1 = '/api/v1';

/**
 * Normaliza un objeto de sesión por si las claves vienen con otro nombre (snake_case vs camelCase).
 * @param {object} row - Objeto crudo de sesión (del CSV o API).
 * @returns {{ connectionName: string, sessionId: string, videoPath: string, typescriptPath: string, createdAt: string }}
 */
function normalizeSession(row) {
  return {
    connectionName: row.connectionName ?? row.connection_name ?? '',
    sessionId: row.sessionId ?? row.session_id ?? '',
    videoPath: row.videoPath ?? row.video_path ?? '',
    typescriptPath: row.typescriptPath ?? row.typescript_path ?? '',
    createdAt: row.createdAt ?? row.created_at ?? ''
  };
}

const SESSIONS_PAGE_SIZE = 10;

/** Página actual del listado de sesiones (1-based). */
let currentSessionsPage = 1;

/** Total de páginas del listado (se actualiza tras cada carga). */
let totalSessionsPages = 1;

const MONTHS_SHORT = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];

/**
 * Formatea una fecha ISO: en celda solo día mes año; en tooltip día mes año y hora completa.
 * @param {string} isoString - Fecha en ISO 8601 (ej. 2026-02-17T21:30:45.123Z).
 * @returns {{ display: string, title: string }}
 */
function formatSessionDate(isoString) {
  const str = (isoString || '').trim();
  if (!str) return { display: '—', title: '' };
  try {
    const d = new Date(str);
    if (Number.isNaN(d.getTime())) return { display: str, title: str };
    const day = d.getDate();
    const month = MONTHS_SHORT[d.getMonth()];
    const year = d.getFullYear();
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    const s = String(d.getSeconds()).padStart(2, '0');
    const ms = String(d.getMilliseconds()).padStart(3, '0');
    const display = `${day} ${month} ${year}`;
    const title = `${day} ${month} ${year}, ${h}:${m}:${s}.${ms}`;
    return { display, title };
  } catch {
    return { display: str, title: str };
  }
}

/**
 * Recorta el session ID a los dos primeros segmentos (split por '-').
 * Ej.: "d1da7c05-b53e-4fb5-aac9-74314029d7e4" → "d1da7c05-b53e". El completo se usa en el tooltip.
 * @param {string} sessionId - UUID o id con guiones.
 * @returns {{ short: string, full: string }}
 */
function shortenSessionId(sessionId) {
  const s = (sessionId || '').trim();
  if (!s) return { short: '—', full: '' };
  const parts = s.split('-');
  const short = parts.length >= 2 ? parts.slice(0, 2).join('-') : s;
  return { short, full: s };
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
 * Obtiene las sesiones del endpoint GET /api/v1/sessions (paginado) y rellena la tabla.
 * @param {number} page - Página a cargar (1-based).
 */
async function loadSessionsTable(page = 1) {
  const tbody = document.getElementById('sessions-tbody');
  const emptyEl = document.getElementById('sessions-empty');
  const paginationEl = document.getElementById('sessions-pagination');
  const paginationInfoEl = document.getElementById('pagination-info');
  const btnPrev = document.getElementById('btn-prev-page');
  const btnNext = document.getElementById('btn-next-page');

  if (!tbody || !emptyEl) return;

  currentSessionsPage = page;

  try {
    const response = await fetch(`${API_BASE}${API_V1}/sessions?page=${page}&limit=${SESSIONS_PAGE_SIZE}`);
    const data = await response.json();
    const sessions = Array.isArray(data.sessions) ? data.sessions : [];
    const pagination = data.pagination || { total: 0, page: 1, limit: SESSIONS_PAGE_SIZE, totalPages: 1 };

    totalSessionsPages = Math.max(1, pagination.totalPages || 1);

    tbody.innerHTML = '';

    if (sessions.length === 0 && page === 1) {
      emptyEl.classList.add('visible');
      if (paginationEl) paginationEl.classList.add('hidden');
      return;
    }

    emptyEl.classList.remove('visible');
    if (paginationEl) paginationEl.classList.remove('hidden');

    sessions.forEach((row) => {
      const session = normalizeSession(row);
      const connectionNameEscaped = escapeHtml(session.connectionName || '—');
      const sessionIdInfo = shortenSessionId(session.sessionId);
      const sessionIdShortEscaped = escapeHtml(sessionIdInfo.short);
      const sessionIdFullEscaped = escapeHtml(sessionIdInfo.full);
      const dateInfo = formatSessionDate(session.createdAt);
      const dateDisplayEscaped = escapeHtml(dateInfo.display);
      const dateTitleEscaped = escapeHtml(dateInfo.title);
      const videoCellInfo = cellWithTitle(session.videoPath);
      const typescriptCellInfo = cellWithTitle(session.typescriptPath);
      const hasVideo = (session.videoPath || '').trim().length > 0;
      const hasText = (session.typescriptPath || '').trim().length > 0;
      const tr = document.createElement('tr');
      tr.dataset.sessionId = session.sessionId;
      tr.innerHTML = `
        <td class="cell-connection">${connectionNameEscaped}</td>
        <td class="cell-session"><code class="has-tooltip" data-tooltip="${sessionIdFullEscaped}">${sessionIdShortEscaped}</code></td>
        <td class="cell-date"><span class="has-tooltip date-display" data-tooltip="${dateTitleEscaped}">${dateDisplayEscaped}</span></td>
        <td class="cell-path"><span class="has-tooltip" data-tooltip="${escapeHtml(videoCellInfo.title)}">${escapeHtml(videoCellInfo.short === '—' ? '—' : 'Sí')}</span></td>
        <td class="cell-path"><span class="has-tooltip" data-tooltip="${escapeHtml(typescriptCellInfo.title)}">${escapeHtml(typescriptCellInfo.short === '—' ? '—' : 'Sí')}</span></td>
        <td class="cell-actions">
          ${hasVideo ? '<button type="button" class="btn-cell btn-video" title="Ver grabación">Ver video</button>' : ''}
          ${hasText ? '<button type="button" class="btn-cell btn-text" title="Ver log de texto">Ver texto</button>' : ''}
          <button type="button" class="btn-cell btn-delete" title="Borrar sesión">Borrar</button>
        </td>
      `;
      tbody.appendChild(tr);
    });

    if (paginationInfoEl) {
      paginationInfoEl.textContent = `Página ${pagination.page} de ${totalSessionsPages}`;
    }
    if (btnPrev) btnPrev.disabled = page <= 1;
    if (btnNext) btnNext.disabled = page >= totalSessionsPages;
  } catch (err) {
    tbody.innerHTML = '<tr><td colspan="6" class="cell-error">Error al cargar sesiones</td></tr>';
    emptyEl.classList.remove('visible');
    if (paginationEl) paginationEl.classList.add('hidden');
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
  const tokenResponse = await fetch(`${API_BASE}${API_V1}/guacamole/token?connection=${encodeURIComponent(nameConnection)}`);
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
    const response = await fetch(`${API_BASE}${API_V1}/view/log?sessionId=${encodeURIComponent(sessionId)}`);
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
 * onresize para scale(), connect() y play(). Los datos de sesión vienen del CSV (GET /api/v1/sessions, GET /api/v1/view/video).
 * @param {string} sessionId - Identificador de la sesión cuya grabación se va a reproducir.
 */
function abrirReproductor(sessionId) {
  const display = document.getElementById('video-display');
  const modal = document.getElementById('modal-video');
  if (!display || !modal) return;
  display.innerHTML = '';

  const videoUrl = `${API_BASE}${API_V1}/view/video?sessionId=${encodeURIComponent(sessionId)}`;
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
 * Manejador de clics en la tabla de sesiones: "Ver video", "Ver texto" o "Borrar".
 * @param {MouseEvent} e - Evento de clic.
 */
function onSessionActionClick(e) {
  const btn = e.target.closest('.btn-video, .btn-text, .btn-delete');
  if (!btn || btn.disabled) return;
  const row = e.target.closest('tr');
  const sessionId = row && row.dataset.sessionId;
  if (!sessionId) return;
  if (btn.classList.contains('btn-video')) openVideoPopup(sessionId);
  else if (btn.classList.contains('btn-text')) openLogPopup(sessionId);
  else if (btn.classList.contains('btn-delete')) openDeleteSessionModal(sessionId);
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

/** Frases aleatorias para confirmar "Borrar todo" (se elige una cada vez que se abre el modal). */
const CONFIRM_DELETE_PHRASES = [
  'eliminar todo',
  'confirmar borrado total',
  'si borro todo',
  'eliminar sesiones',
  'vaciar listado',
  'borrado irreversible',
  'confirmar eliminación',
  'eliminar grabaciones',
  'acepto borrar todo',
  'confirmar vaciado',
];

/** Código de confirmación actual del modal Borrar todo (se genera al abrir). */
let currentConfirmPhrase = '';

/**
 * Genera la frase o código que el usuario debe escribir para confirmar borrar todo.
 * Usa una frase aleatoria o, si hay sesiones en la tabla, a veces el sessionId de la primera.
 */
function getRandomConfirmPhrase() {
  const firstRow = document.querySelector('#sessions-tbody tr[data-session-id]');
  const sessionId = firstRow?.dataset.sessionId?.trim();
  const useSessionId = sessionId && Math.random() < 0.4;
  if (useSessionId) return sessionId;
  const idx = Math.floor(Math.random() * CONFIRM_DELETE_PHRASES.length);
  return CONFIRM_DELETE_PHRASES[idx];
}

function openDeleteAllModal() {
  const modal = document.getElementById('modal-delete-all');
  const input = document.getElementById('input-confirm-delete');
  const btnConfirm = document.getElementById('btn-confirm-delete-all');
  const phraseEl = document.getElementById('confirm-phrase-display');
  if (modal && input && btnConfirm && phraseEl) {
    currentConfirmPhrase = getRandomConfirmPhrase();
    phraseEl.textContent = currentConfirmPhrase;
    input.value = '';
    btnConfirm.disabled = true;
    modal.classList.remove('hidden');
    input.focus();
  }
}

function closeDeleteAllModal() {
  const modal = document.getElementById('modal-delete-all');
  const input = document.getElementById('input-confirm-delete');
  if (modal && input) {
    modal.classList.add('hidden');
    input.value = '';
    currentConfirmPhrase = '';
  }
}

function updateDeleteAllConfirmButton() {
  const input = document.getElementById('input-confirm-delete');
  const btnConfirm = document.getElementById('btn-confirm-delete-all');
  if (input && btnConfirm) {
    btnConfirm.disabled = (input.value || '').trim() !== currentConfirmPhrase;
  }
}

async function confirmDeleteAll() {
  const input = document.getElementById('input-confirm-delete');
  if ((input?.value || '').trim() !== currentConfirmPhrase) return;
  try {
    const response = await fetch(`${API_BASE}${API_V1}/sessions/clean-recordings`, { method: 'POST' });
    const data = await response.json();
    if (data.ok) {
      closeDeleteAllModal();
      await loadSessionsTable(1);
    } else {
      alert('No se pudo completar la acción.');
    }
  } catch (e) {
    alert('Error al borrar.');
  }
}

document.getElementById('btn-delete-all')?.addEventListener('click', openDeleteAllModal);
document.getElementById('btn-close-delete-all')?.addEventListener('click', closeDeleteAllModal);
document.getElementById('btn-cancel-delete-all')?.addEventListener('click', closeDeleteAllModal);
document.querySelector('.modal-backdrop[data-action="close-delete-all"]')?.addEventListener('click', closeDeleteAllModal);
document.getElementById('input-confirm-delete')?.addEventListener('input', updateDeleteAllConfirmButton);
document.getElementById('input-confirm-delete')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') confirmDeleteAll();
});
document.getElementById('btn-confirm-delete-all')?.addEventListener('click', confirmDeleteAll);

document.getElementById('btn-prev-page')?.addEventListener('click', () => {
  if (currentSessionsPage > 1) loadSessionsTable(currentSessionsPage - 1);
});
document.getElementById('btn-next-page')?.addEventListener('click', () => {
  if (currentSessionsPage < totalSessionsPages) loadSessionsTable(currentSessionsPage + 1);
});

/** Modal Borrar sesión: UUID que el usuario debe escribir para confirmar. */
let currentDeleteSessionId = '';

function openDeleteSessionModal(sessionId) {
  const modal = document.getElementById('modal-delete-session');
  const input = document.getElementById('input-confirm-delete-session');
  const btnConfirm = document.getElementById('btn-confirm-delete-session');
  const uuidDisplay = document.getElementById('delete-session-uuid-display');
  if (modal && input && btnConfirm && uuidDisplay) {
    currentDeleteSessionId = (sessionId || '').trim();
    uuidDisplay.textContent = currentDeleteSessionId;
    input.value = '';
    btnConfirm.disabled = true;
    modal.classList.remove('hidden');
    input.focus();
  }
}

function closeDeleteSessionModal() {
  const modal = document.getElementById('modal-delete-session');
  const input = document.getElementById('input-confirm-delete-session');
  if (modal && input) {
    modal.classList.add('hidden');
    input.value = '';
    currentDeleteSessionId = '';
  }
}

function updateDeleteSessionConfirmButton() {
  const input = document.getElementById('input-confirm-delete-session');
  const btnConfirm = document.getElementById('btn-confirm-delete-session');
  if (input && btnConfirm) {
    btnConfirm.disabled = (input.value || '').trim() !== currentDeleteSessionId;
  }
}

async function confirmDeleteSession() {
  const input = document.getElementById('input-confirm-delete-session');
  if ((input?.value || '').trim() !== currentDeleteSessionId || !currentDeleteSessionId) return;
  try {
    const response = await fetch(`${API_BASE}${API_V1}/sessions/${encodeURIComponent(currentDeleteSessionId)}`, { method: 'DELETE' });
    const data = await response.json();
    if (data.ok) {
      closeDeleteSessionModal();
      await loadSessionsTable(currentSessionsPage);
    } else {
      alert(data.error || 'No se pudo eliminar la sesión.');
    }
  } catch (e) {
    alert('Error al borrar la sesión.');
  }
}

document.getElementById('btn-close-delete-session')?.addEventListener('click', closeDeleteSessionModal);
document.getElementById('btn-cancel-delete-session')?.addEventListener('click', closeDeleteSessionModal);
document.querySelector('.modal-backdrop[data-action="close-delete-session"]')?.addEventListener('click', closeDeleteSessionModal);
document.getElementById('input-confirm-delete-session')?.addEventListener('input', updateDeleteSessionConfirmButton);
document.getElementById('input-confirm-delete-session')?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') confirmDeleteSession();
});
document.getElementById('btn-confirm-delete-session')?.addEventListener('click', confirmDeleteSession);

/* Tooltips personalizados (delegación): mostrar #tooltip-root al pasar sobre .has-tooltip */
const tooltipRoot = document.getElementById('tooltip-root');
let tooltipHideTimeout = null;

function showTooltip(el) {
  const text = el.getAttribute('data-tooltip');
  if (!text || !tooltipRoot) return;
  tooltipRoot.textContent = text;
  tooltipRoot.classList.add('visible');
  const rect = el.getBoundingClientRect();
  requestAnimationFrame(() => {
    const ttRect = tooltipRoot.getBoundingClientRect();
    const gap = 8;
    let top = rect.top - ttRect.height - gap;
    let left = rect.left + (rect.width / 2) - (ttRect.width / 2);
    if (top < 8) top = rect.bottom + gap;
    left = Math.max(12, Math.min(left, document.documentElement.clientWidth - ttRect.width - 12));
    top = Math.max(12, Math.min(top, document.documentElement.clientHeight - ttRect.height - 12));
    tooltipRoot.style.left = `${left}px`;
    tooltipRoot.style.top = `${top}px`;
  });
}

function hideTooltip() {
  if (tooltipHideTimeout) clearTimeout(tooltipHideTimeout);
  tooltipHideTimeout = setTimeout(() => {
    if (tooltipRoot) tooltipRoot.classList.remove('visible');
    tooltipHideTimeout = null;
  }, 50);
}

document.body.addEventListener('mouseover', (e) => {
  const el = e.target.closest('.has-tooltip');
  if (tooltipHideTimeout) clearTimeout(tooltipHideTimeout);
  if (!el) {
    hideTooltip();
    return;
  }
  showTooltip(el);
});

document.body.addEventListener('mouseout', (e) => {
  const el = e.target.closest('.has-tooltip');
  if (!el || !e.relatedTarget?.closest?.('.has-tooltip')) hideTooltip();
});

loadSessionsTable(1);
