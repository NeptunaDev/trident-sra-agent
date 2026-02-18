import axios from 'axios';

/**
 * Base URL de la API (ej. http://localhost:3417).
 * En Electron se obtiene del preload (window.electronAPI.getApiPort()).
 */
export function getApiBase() {
  const port = typeof window !== 'undefined' && window.electronAPI?.getApiPort?.()
    ? window.electronAPI.getApiPort()
    : '3417';
  return `http://localhost:${port}`;
}

const API_V1 = '/api/v1';

export function getApiV1Base() {
  return `${getApiBase()}${API_V1}`;
}

/** Instancia de axios con baseURL y timeout. */
export const apiClient = axios.create({
  baseURL: getApiBase(),
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

/** Prefijo para rutas v1. */
export { API_V1 };
