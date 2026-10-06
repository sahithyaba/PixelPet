const { app, BrowserWindow, Tray, Menu, nativeImage, screen } = require("electron");
const path = require("path");

let petWindow;
let tray;

function createPet() {
  const display = screen.getPrimaryDisplay();
  const { width, height } = display.workAreaSize;

  petWindow = new BrowserWindow({
    width: 180,
    height: 180,
    x: Math.max(20, width - 210),
    y: Math.max(20, height - 210),
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
    { type: "separator" },
    { label: "Quit PixelPet", click: () => app.quit() }
  ]));
}

app.whenReady().then(() => {
  createPet();
  createTray();
});

app.on("window-all-closed", (event) => event.preventDefault());
app.on("before-quit", () => { if (tray) tray.destroy(); });
