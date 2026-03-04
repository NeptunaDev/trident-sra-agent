/**
 * Proceso principal de Electron (Trident Agent).
 *
 * Arranca el servidor API Express en el puerto configurado, crea la ventana principal
 * cargando la interfaz desde src/frontend/index.html y expone el puerto de la API
 * al preload para que el renderer pueda hacer peticiones a la API.
 *
 * __dirname en este archivo = directorio donde está main.js = src/
 */

const { app, BrowserWindow } = require("electron");
const path = require("path");
const fs = require("fs");
const { startApi, PORT } = require("./api");

/** Ventana principal de la aplicación. Null cuando está cerrada. */
let mainWindow;

/** Instancia del servidor HTTP de la API (Express). Se cierra al cerrar todas las ventanas. */
let apiServer;

/** Ruta al frontend construido (Vite). Si no existe, se usa src/frontend (requiere build previo). */
const distFrontend = path.join(
  __dirname,
  "..",
  "dist",
  "frontend",
  "index.html",
);
const srcFrontend = path.join(__dirname, "frontend", "index.html");

/**
 * Crea la ventana principal, inicia la API y carga la interfaz del frontend.
 * El preload (preload.js) se inyecta en la ventana para exponer electronAPI.getApiPort().
 */
async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  await startApi().then((server) => {
    apiServer = server;
  });

  const isDev = process.env.ELECTRON_DEV === "1";
  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
  } else {
    const indexPath = fs.existsSync(distFrontend) ? distFrontend : srcFrontend;
    if (!fs.existsSync(indexPath)) {
      console.error("Frontend not found. Run: npm run build:frontend");
    }
    mainWindow.loadFile(indexPath);
  }
  mainWindow.webContents.openDevTools();

  mainWindow.on("closed", () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
  if (apiServer) apiServer.close();
  if (process.platform !== "darwin") app.quit();
});

app.on("activate", () => {
  if (BrowserWindow.getAllWindows().length === 0) createWindow();
});

/** Expone el puerto de la API al preload para que el renderer construya la URL base (localhost:PORT). */
process.env.API_PORT = String(PORT);
