const { app, BrowserWindow } = require('electron');
const path = require('path');
const { startApi, PORT } = require('./api/server');

// __dirname aquí = directorio de main.js = src/

let mainWindow;
let apiServer;

async function createWindow() {
  mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),   // src/preload.js
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  await startApi().then((server) => {
    apiServer = server;
  });

  mainWindow.loadFile(path.join(__dirname, 'frontend', 'index.html'));  // src/frontend/index.html
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

// Exponer el puerto de la API al preload para el frontend
process.env.API_PORT = String(PORT);
