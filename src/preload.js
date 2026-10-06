const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("pixelPet", {
  platform: process.platform,
  quit: () => ipcRenderer.send("quit-app")
});
