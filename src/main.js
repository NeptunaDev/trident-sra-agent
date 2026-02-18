/**
 * Proceso principal de Electron (Trident Agent).
 *
 * Arranca el servidor API Express en el puerto configurado, crea la ventana principal
 * cargando la interfaz desde src/frontend/index.html y expone el puerto de la API
 * al preload para que el renderer pueda hacer peticiones a la API.
 *
 * __dirname en este archivo = directorio donde está main.js = src/
 */

const { app, BrowserWindow } = require('electron');
const path = require('path');
const { startApi, PORT } = require('./api/server');

/** Ventana principal de la aplicación. Null cuando está cerrada. */
let mainWindow;

/** Instancia del servidor HTTP de la API (Express). Se cierra al cerrar todas las ventanas. */
let apiServer;

/**
 * Crea la ventana principal, inicia la API y carga la interfaz del frontend.
 * El preload (preload.js) se inyecta en la ventana para exponer electronAPI.getApiPort().
 */
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  await startApi().then((server) => {
    apiServer = server;
  });

  mainWindow.loadFile(path.join(__dirname, 'frontend', 'index.html'));
  mainWindow.webContents.openDevTools();

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (apiServer) apiServer.close();
  if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

/** Expone el puerto de la API al preload para que el renderer construya la URL base (localhost:PORT). */
process.env.API_PORT = String(PORT);
