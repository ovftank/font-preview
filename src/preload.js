const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    getFonts: () => ipcRenderer.invoke('get-fonts'),
    minimizeWindow: () => ipcRenderer.send('window:minimize'),
    closeWindow: () => ipcRenderer.send('window:close'),

    installUpdate: () => ipcRenderer.send('install-update'),
    onUpdateStatus: (callback) => ipcRenderer.on('update-status', callback),
    removeUpdateListeners: () => ipcRenderer.removeAllListeners('update-status')
});
