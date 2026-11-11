// Bridge between the main process and the pages (overlay + settings).
// The pages only get these functions, not full Node access.
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('catBreak', {
  // overlay
  onStartBreak: (callback) => ipcRenderer.on('start-break', (_event, data) => callback(data)),
  finishBreak: () => ipcRenderer.send('break-finished'),

  // both pages: returns a data: URL for assets/cat-<name>.png, or null if it doesn't exist yet
  loadSprite: (name) => ipcRenderer.invoke('load-sprite', name),

  // settings window
  getSettings: () => ipcRenderer.invoke('get-settings'),
  saveSettings: (settings) => ipcRenderer.invoke('save-settings', settings),
  previewBreak: () => ipcRenderer.send('preview-break'),
});
