// Main process: owns the timer, settings, the tray icon, and the windows.
const { app, BrowserWindow, Tray, Menu, nativeImage, screen, ipcMain } = require('electron');
const path = require('node:path');
const fs = require('node:fs');

// `npm run dev` passes --dev: breaks come every 15 seconds and naps last 15 seconds.
const DEV = process.argv.includes('--dev');

// ---------- settings ----------

const DEFAULTS = { intervalMinutes: 45, napMinutes: 5, color: 'pink', breed: 'orange-tabby' };
const SPRITE_NAMES = ['walk', 'sit', 'sleep'];

let settingsPath;
let settings;

function sanitize(s) {
  const num = (v, min, max, fallback) => {
    const n = Number(v);
    return Number.isFinite(n) ? Math.min(max, Math.max(min, n)) : fallback;
  };
  const isColor = typeof s.color === 'string' && /^(pink|blue|purple|green|#[0-9a-f]{6})$/i.test(s.color);
  const isBreed = typeof s.breed === 'string' && /^[a-z-]{1,40}$/.test(s.breed);
  return {
    intervalMinutes: num(s.intervalMinutes, 1, 240, DEFAULTS.intervalMinutes),
    napMinutes: num(s.napMinutes, 1, 30, DEFAULTS.napMinutes),
    color: isColor ? s.color : DEFAULTS.color,
    breed: isBreed ? s.breed : DEFAULTS.breed,
  };
}

function loadSettings() {
  settingsPath = path.join(app.getPath('userData'), 'settings.json');
  try {
    return sanitize({ ...DEFAULTS, ...JSON.parse(fs.readFileSync(settingsPath, 'utf8')) });
  } catch {
    return { ...DEFAULTS }; // first run, or the file is unreadable
  }
}

const intervalMs = () => (DEV ? 15 : settings.intervalMinutes * 60) * 1000;
const napMinutes = () => (DEV ? 0.25 : settings.napMinutes);

// ---------- break timer ----------

let overlay;
let settingsWindow;
let tray; // keep a reference so the tray icon isn't garbage-collected
let breakTimer;
let lastBreakEnd = Date.now();
let onBreak = false;

function scheduleNextBreak() {
  clearTimeout(breakTimer);
  breakTimer = setTimeout(startBreak, intervalMs());
}

function startBreak() {
  if (onBreak) return;
  onBreak = true;
  clearTimeout(breakTimer);
  const minutesWorked = Math.max(1, Math.round((Date.now() - lastBreakEnd) / 60000));
  overlay.show();
  overlay.focus();
  overlay.webContents.send('start-break', {
    minutesWorked,
    napMinutes: napMinutes(),
    color: settings.color,
    breed: settings.breed,
  });
}

// ---------- windows ----------

function createOverlay() {
  const { bounds } = screen.getPrimaryDisplay();
  overlay = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    show: false,
    frame: false,
    transparent: true, // lets the pastel tint fade in over whatever is on screen
    resizable: false,
    movable: false,
    skipTaskbar: true,
    hasShadow: false,
    alwaysOnTop: true,
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  });
  overlay.setAlwaysOnTop(true, 'screen-saver'); // sit above full-screen apps too
  overlay.loadFile(path.join(__dirname, 'src', 'overlay.html'));
}

function openSettings() {
  if (settingsWindow) {
    settingsWindow.show();
    settingsWindow.focus();
    return;
  }
  settingsWindow = new BrowserWindow({
    width: 560,
    height: 760,
    title: 'cat-break settings',
    autoHideMenuBar: true,
    backgroundColor: '#fff4f7',
    webPreferences: { preload: path.join(__dirname, 'preload.js') },
  });
  settingsWindow.loadFile(path.join(__dirname, 'src', 'settings.html'));
  settingsWindow.on('closed', () => { settingsWindow = null; });
}

// ---------- messages from the pages ----------

ipcMain.on('break-finished', () => {
  overlay.hide();
  onBreak = false;
  lastBreakEnd = Date.now();
  scheduleNextBreak();
});

ipcMain.handle('load-sprite', (_event, name) => {
  if (!SPRITE_NAMES.includes(name)) return null; // only ever read our own asset files
  try {
    const png = fs.readFileSync(path.join(__dirname, 'assets', `cat-${name}.png`));
    return `data:image/png;base64,${png.toString('base64')}`;
  } catch {
    return null;
  }
});

ipcMain.handle('get-settings', () => settings);

ipcMain.handle('save-settings', (_event, next) => {
  const previousInterval = settings.intervalMinutes;
  settings = sanitize({ ...settings, ...next });
  fs.mkdirSync(path.dirname(settingsPath), { recursive: true });
  fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
  updateTrayTooltip();
  // Only restart the countdown if the interval actually changed.
  if (settings.intervalMinutes !== previousInterval && !onBreak) {
    lastBreakEnd = Date.now();
    scheduleNextBreak();
  }
  return settings;
});

ipcMain.on('preview-break', startBreak);

// ---------- tray ----------

// A tiny 16x16 pink cat head, drawn pixel by pixel, so we don't need an icon file yet.
function makeTrayIcon() {
  const size = 16;
  const buf = Buffer.alloc(size * size * 4); // BGRA, starts fully transparent
  const set = (x, y, [r, g, b]) => {
    const i = (y * size + x) * 4;
    buf[i] = b; buf[i + 1] = g; buf[i + 2] = r; buf[i + 3] = 255;
  };
  const pink = [244, 167, 192];
  const dark = [74, 50, 40];
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const head = y >= 5 && y <= 14 && x >= 2 && x <= 13;
      const leftEar = y >= 1 && y <= 4 && x >= 2 && x <= 2 + (y - 1);
      const rightEar = y >= 1 && y <= 4 && x <= 13 && x >= 13 - (y - 1);
      if (head || leftEar || rightEar) set(x, y, pink);
    }
  }
  set(5, 9, dark);
  set(10, 9, dark);
  return nativeImage.createFromBitmap(buf, { width: size, height: size });
}

function updateTrayTooltip() {
  tray.setToolTip(`cat-break: a break every ${DEV ? '15 sec (dev)' : `${settings.intervalMinutes} min`}`);
}

function createTray() {
  tray = new Tray(makeTrayIcon());
  updateTrayTooltip();
  tray.setContextMenu(Menu.buildFromTemplate([
    { label: 'Take a break now', click: startBreak },
    { label: 'Settings…', click: openSettings },
    { type: 'separator' },
    { label: 'Quit cat-break', click: () => app.quit() },
  ]));
  tray.on('double-click', openSettings);
}

// ---------- startup ----------

app.whenReady().then(() => {
  settings = loadSettings();
  createOverlay();
  createTray();
  scheduleNextBreak();
  openSettings(); // visible sign the app started; closing it leaves cat-break in the tray
  if (DEV) {
    console.log('Dev mode: a break will start in 15 seconds.');
    console.log('Settings file:', settingsPath);
  }
});

// The overlay is hidden, not closed, between breaks, and the app keeps running in the
// tray after the settings window closes.
app.on('window-all-closed', () => {});
