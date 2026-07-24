const { contextBridge, ipcRenderer } = require('electron')

// Expose window controls to frontend safely
contextBridge.exposeInMainWorld('electronAPI', {
  minimize: () => ipcRenderer.send('minimize-app'),
  maximize: () => ipcRenderer.send('maximize-app'),
  close:    () => ipcRenderer.send('close-app'),
})
