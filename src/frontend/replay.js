/**
 * Reproducción de grabación .guac en el navegador (sin guacd).
 * SessionRecording parsea el Blob y reproduce las instrucciones del protocolo Guacamole.
 * Parámetros URL: sessionId, apiBase (ej. http://localhost:3417)
 */
import Guacamole from './vendor/guacamole-common.js';

const params = new URLSearchParams(window.location.search);
const sessionId = params.get('sessionId');
const apiBase = params.get('apiBase') || 'http://localhost:3417';

const statusEl = document.getElementById('status');
const displayWrap = document.getElementById('display-wrap');
const btnPlay = document.getElementById('btn-play');
const btnPause = document.getElementById('btn-pause');
const progressEl = document.getElementById('progress');

function setStatus(msg, isError = false) {
  statusEl.textContent = msg;
  statusEl.classList.toggle('error', isError);
}

function updateProgress() {
  if (!recording || !progressEl) return;
  const pos = recording.getPosition();
  const dur = recording.getDuration();
  const pct = dur > 0 ? Math.round((pos / dur) * 100) : 0;
  progressEl.value = pct;
  progressEl.title = `${Math.round(pos / 1000)}s / ${Math.round(dur / 1000)}s`;
}

let recording = null;
let progressInterval = null;

async function init() {
  if (!sessionId) {
    setStatus('Falta sessionId en la URL.', true);
    return;
  }
  try {
    setStatus('Descargando grabación…');
    const res = await fetch(`${apiBase}/view-video?sessionId=${encodeURIComponent(sessionId)}`);
    if (!res.ok) {
      setStatus('No se encontró la grabación.', true);
      return;
    }
    const blob = await res.blob();
    setStatus('Parseando grabación…');
    recording = new Guacamole.SessionRecording(blob);

    const display = recording.getDisplay().getElement();
    displayWrap.innerHTML = '';
    displayWrap.appendChild(display);

    recording.onload = () => {
      setStatus(`Listo (${Math.round(recording.getDuration() / 1000)}s). Pulsa Reproducir.`);
      btnPlay.disabled = false;
      btnPause.disabled = false;
      if (progressEl) progressEl.max = 100;
      recording.play();
      setStatus('Reproduciendo…');
      progressInterval = setInterval(updateProgress, 200);
    };
    recording.onplay = () => setStatus('Reproduciendo…');
    recording.onpause = () => {
      setStatus('Pausado.');
      if (progressInterval) clearInterval(progressInterval);
    };

    btnPlay.addEventListener('click', () => {
      recording.play();
      setStatus('Reproduciendo…');
      progressInterval = setInterval(updateProgress, 200);
    });
    btnPause.addEventListener('click', () => recording.pause());
  } catch (e) {
    setStatus('Error: ' + (e.message || 'no se pudo cargar'), true);
  }
}

init();
