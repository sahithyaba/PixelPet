const { app, BrowserWindow, Tray, Menu, nativeImage, screen, ipcMain } = require("electron");
const os = require("os");
const path = require("path");

let petWindow;
let tray;

function createPet() {
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;

  petWindow = new BrowserWindow({
    width: 340,
    height: 330,
    x: Math.max(20, width - 380),
    y: Math.max(20, height - 360),
    frame: false,
    transparent: true,
    resizable: false,
    movable: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    hasShadow: false,
    backgroundColor: "#00000000",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  petWindow.setAlwaysOnTop(true, "floating");
  petWindow.loadFile(path.join(__dirname, "renderer", "index.html"));
  petWindow.on("closed", () => { petWindow = null; });
}

function createTray() {
  tray = new Tray(nativeImage.createEmpty());
  tray.setToolTip("PixelPet");

  tray.setContextMenu(Menu.buildFromTemplate([
    { label: "Show PixelPet", click: () => petWindow?.show() },
    { label: "Hide PixelPet", click: () => petWindow?.hide() },
    { type: "separator" },
    { label: "Quit PixelPet", click: () => app.quit() }
  ]));
}

ipcMain.handle("system-info", () => ({
  platform: process.platform,
  cpu: os.cpus()[0]?.model || "Unknown",
  cpuCores: os.cpus().length,
  memoryTotalGB: +(os.totalmem() / 1024 ** 3).toFixed(1),
  memoryFreeGB: +(os.freemem() / 1024 ** 3).toFixed(1),
  uptimeMinutes: Math.floor(os.uptime() / 60)
}));

ipcMain.on("quit-app", () => app.quit());

app.whenReady().then(() => {
  createPet();
  createTray();
});

app.on("window-all-closed", (event) => event.preventDefault());
app.on("before-quit", () => tray?.destroy());
