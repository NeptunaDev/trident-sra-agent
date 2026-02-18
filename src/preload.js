const { contextBridge } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getApiPort: () => process.env.API_PORT || '3417',
});
