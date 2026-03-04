/**
 * Preload script de Electron para Trident Agent.
 *
 * Se ejecuta en un contexto aislado antes de que el renderer cargue la página.
 * Expone de forma segura (contextBridge) la API mínima que el frontend necesita:
 * el puerto en el que escucha el servidor Express, para construir la URL base
 * de las peticiones (ej. http://localhost:3417).
 *
 * No se expone Node ni require; solo getApiPort().
 */

const { contextBridge } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  /**
   * Devuelve el puerto en el que escucha la API Express (p. ej. '3417').
   * @returns {string}
   */
  getApiPort: () => process.env.API_PORT || "3417",
});
