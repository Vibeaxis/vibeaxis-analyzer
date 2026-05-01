import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { fork } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow;
let serverProcess;

// THE MISSING LINE IS RIGHT HERE:
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    backgroundColor: '#09090b',
    title: "VibeAxis Slop Analyzer", 
    icon: path.join(__dirname, 'dist', 'icon.ico'), 
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
}

app.whenReady().then(() => {
  // Boot the Node server and pass the exact system paths as environment variables
  const serverPath = path.join(__dirname, 'server.js');
  serverProcess = fork(serverPath, [], {
      env: { 
        ...process.env, 
        ELECTRON_RUN_AS_NODE: '1', 
        IS_PACKAGED: app.isPackaged ? 'true' : 'false', 
        RESOURCES_PATH: process.resourcesPath 
      }
  });
  
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    if (serverProcess) serverProcess.kill();
    app.quit();
  }
});