const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('obsidianApp', {
  chooseVault: () => ipcRenderer.invoke('vault:choose'),
  vaultStatus: () => ipcRenderer.invoke('vault:status'),
  listNotes: () => ipcRenderer.invoke('notes:list'),
  readNote: (filePath) => ipcRenderer.invoke('notes:read', filePath),
  createNote: (title) => ipcRenderer.invoke('notes:create', title),
  saveNote: (filePath, content) => ipcRenderer.invoke('notes:save', filePath, content),
  deleteNote: (filePath) => ipcRenderer.invoke('notes:delete', filePath)
});

