import { app, BrowserWindow } from 'electron'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import squirrel from 'electron-squirrel-startup'
import { startServer, stopServer } from '../server/index.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let mainWindow
let shuttingDown = false

function createWindow () {
  mainWindow = new BrowserWindow({
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: true,
      enableBlinkFeatures: 'AudioVideoTracks',
      enableRemoteModule: true,
      backgroundThrottling: false,
      autoplayPolicy: 'no-user-gesture-required',
      webSecurity: true,
      sandbox: false
      // preload: path.join(__dirname, "preload.js"), // Путь к файлу preload.js
    }
  })

  mainWindow.loadFile(path.join(__dirname, 'index.html'))

  // mainWindow.webContents.openDevTools()

  mainWindow.on('closed', () => (mainWindow = null))

  mainWindow.on('enter-full-screen', () => {
    mainWindow.setMenuBarVisibility(false)
  })

  mainWindow.on('leave-full-screen', () => {
    mainWindow.setMenuBarVisibility(true)
  })
}

// Функция для безопасного закрытия торрент-клиента и HTTP-сервера перед выходом
function quitApp () {
  if (shuttingDown) return
  shuttingDown = true

  stopServer('quit').finally(() => app.quit())
}

if (squirrel) {
  app.quit()
}

// Обработка события 'ready'
app.whenReady().then(() => {
  startServer() // ОБЯЗАТЕЛЬНО запускаем сервер до создания окна
  createWindow()
})

// Обработка события 'activate'
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    quitApp()
  }
})

app.on('before-quit', (event) => {
  if (!shuttingDown) {
    event.preventDefault()
    quitApp()
  }
})
