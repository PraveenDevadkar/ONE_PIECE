const { app, BrowserWindow, ipcMain } = require('electron')
const { spawn } = require('child_process')
const path = require('path')

let mainWindow
let backendProcess

// ── START PYTHON BACKEND AUTOMATICALLY ──────────────────────────
function startBackend() {
  const backendPath = path.join(__dirname, '..', 'backend')
  const venvPython  = path.join(backendPath, 'venv', 'Scripts', 'python.exe')

  backendProcess = spawn(venvPython, [
    '-m', 'uvicorn', 'main:app',
    '--host', '127.0.0.1',
    '--port', '8000'
  ], {
    cwd: backendPath,
    env: { ...process.env }
  })

  backendProcess.stdout.on('data', d => console.log('Backend:', d.toString()))
  backendProcess.stderr.on('data', d => console.log('Backend:', d.toString()))
  backendProcess.on('close', code => console.log('Backend exited:', code))
}

// ── CREATE WINDOW ────────────────────────────────────────────────
function createWindow() {
  mainWindow = new BrowserWindow({
    width:  1280,
    height: 800,
    minWidth:  900,
    minHeight: 600,
    backgroundColor: '#020508',
    // Custom titlebar — remove default OS bar
    frame:           false,
    titleBarStyle:   'hidden',
    webPreferences: {
      nodeIntegration:  false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  })

  // Load login page
  mainWindow.loadFile(path.join(__dirname, 'pages', 'login.html'))

  // Open DevTools during development — remove this line later
  // mainWindow.webContents.openDevTools()

  mainWindow.on('closed', () => { mainWindow = null })
}

// ── APP LIFECYCLE ────────────────────────────────────────────────
app.whenReady().then(() => {
  startBackend()
  // Wait 2 seconds for backend to start before opening window
  setTimeout(createWindow, 2000)
})

app.on('window-all-closed', () => {
  if (backendProcess) backendProcess.kill()
  if (process.platform !== 'darwin') app.quit()
})

app.on('activate', () => {
  if (!mainWindow) createWindow()
})

// ── IPC — window controls ────────────────────────────────────────
ipcMain.on('minimize-app', () => mainWindow?.minimize())
ipcMain.on('maximize-app', () => {
  if (mainWindow?.isMaximized()) mainWindow.unmaximize()
  else mainWindow?.maximize()
})
ipcMain.on('close-app', () => {
  if (backendProcess) backendProcess.kill()
  app.quit()
})
