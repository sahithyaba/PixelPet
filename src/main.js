const { app, BrowserWindow, Tray, Menu, nativeImage, screen, ipcMain } = require("electron");
const os = require("os");
const path = require("path");

let petWindow;
let tray;
let movementTimer;

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

  petWindow.setAlwaysOnTop(true, "screen-saver");
  // Keep the pet visible across macOS Spaces and fullscreen apps.
  petWindow.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true });
  petWindow.setFullScreenable(false);
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

ipcMain.on("move-pet", (_event, position) => {
  if (!petWindow || petWindow.isDestroyed()) return;
  clearInterval(movementTimer);
  const current = petWindow.getPosition();
  const display = screen.getDisplayNearestPoint({ x: current[0], y: current[1] });
  const bounds = display.workArea;
  const targetX = Math.max(bounds.x + 10, Math.min(Number(position.x) || bounds.x + 10, bounds.x + bounds.width - 340));
  const targetY = Math.max(bounds.y + 10, Math.min(Number(position.y) || bounds.y + 10, bounds.y + bounds.height - 330));
  const startX = current[0];
  const startY = current[1];
  const duration = Math.max(400, Math.min(Number(position.duration) || 1200, 4000));
  const started = Date.now();
  movementTimer = setInterval(() => {
    if (!petWindow || petWindow.isDestroyed()) return clearInterval(movementTimer);
    const progress = Math.min(1, (Date.now() - started) / duration);
    const eased = progress < 0.5 ? 2 * progress * progress : 1 - Math.pow(-2 * progress + 2, 2) / 2;
    petWindow.setPosition(Math.round(startX + (targetX - startX) * eased), Math.round(startY + (targetY - startY) * eased), false);
    if (progress >= 1) clearInterval(movementTimer);
  }, 16);
});

ipcMain.on("quit-app", () => app.quit());

app.whenReady().then(() => {
  createPet();
  createTray();
});

app.on("window-all-closed", (event) => event.preventDefault());
app.on("before-quit", () => tray?.destroy());
