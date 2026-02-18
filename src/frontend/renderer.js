const API_PORT = typeof window !== 'undefined' && window.electronAPI?.getApiPort?.() ? window.electronAPI.getApiPort() : '3417';
const API_BASE = `http://localhost:${API_PORT}`;

function getEl(id) {
  return document.getElementById(id);
}

async function api(path, options = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

