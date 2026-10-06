const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("launcher", {
    play: () => ipcRenderer.invoke("launch-game"),
    chooseGame: () => ipcRenderer.invoke("choose-game"),
    getSettings: () => ipcRenderer.invoke("get-settings")
});
