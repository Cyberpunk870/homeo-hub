const { app, BrowserWindow } = require('electron');
const path = require('node:path');
const { spawn } = require('node:child_process');

const DEFAULT_PORT = Number(process.env.HOMEOHUB_DESKTOP_PORT || 4321);
const ELECTRON_START_URL = process.env.ELECTRON_START_URL;

let serverProcess = null;

function createWindow() {
  const window = new BrowserWindow({
    width: 1540,
    height: 980,
    minWidth: 1280,
    minHeight: 820,
    backgroundColor: '#eef7f0',
    title: 'HomeoHub Desktop',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  });

  return window;
}

async function waitForServer(url, retries = 80) {
  for (let index = 0; index < retries; index += 1) {
    try {
      const response = await fetch(url, { method: 'GET' });
      if (response.ok || response.status === 404) return true;
    } catch {
      // retry
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

function startServer() {
  if (serverProcess || ELECTRON_START_URL) return;

  const entryPath = path.resolve(app.getAppPath(), 'dist', 'server', 'entry.mjs');
  serverProcess = spawn(process.execPath, [entryPath], {
    env: {
      ...process.env,
      PORT: String(DEFAULT_PORT),
      NODE_ENV: 'production',
    },
    stdio: 'inherit',
  });

  serverProcess.on('exit', () => {
    serverProcess = null;
  });
}

async function bootstrap() {
  const window = createWindow();

  if (ELECTRON_START_URL) {
    await window.loadURL(ELECTRON_START_URL);
    return;
  }

  startServer();
  const appUrl = `http://127.0.0.1:${DEFAULT_PORT}`;
  const ready = await waitForServer(`${appUrl}/api/health`);
  if (!ready) {
    await window.loadURL(`data:text/html,${encodeURIComponent('<h2>HomeoHub failed to start</h2><p>Check the desktop server logs and database configuration.</p>')}`);
    return;
  }

  await window.loadURL(appUrl);
}

app.whenReady().then(() => {
  void bootstrap();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      void bootstrap();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
    serverProcess = null;
  }
});

