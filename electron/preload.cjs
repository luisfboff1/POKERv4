
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('store', {
  getHistory: () => ipcRenderer.invoke('get-history'),
  saveSession: (snapshot) => ipcRenderer.invoke('save-session', snapshot),
  deleteSession: (id) => ipcRenderer.invoke('delete-session', id)
});
