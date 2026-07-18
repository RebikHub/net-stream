import { app, BrowserWindow } from 'electron'
import path, { dirname } from 'path'
import { fileURLToPath } from 'url'
import squirrel from 'electron-squirrel-startup'
import { PORT } from './assets/server/config.js'
import { fork } from 'child_process'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let mainWindow
let serverProcess = null

// Функция для безопасного запуска Express-сервера в фоне
function startServer() {
  // Путь к собранному бандлу сервера внутри ассетов Electron
  const serverPath = path.join(__dirname, 'assets/server/server.js')

  // Просто запускаем процесс. Никаких путей Electron передавать не нужно!
  serverProcess = fork(serverPath, [], {
    env: {
      ...process.env,
      NODE_ENV: 'production'
    }
  })

  serverProcess.on('error', (err) => console.error('Ошибка процесса сервера:', err))
  serverProcess.on('exit', (code) => console.log(`Сервер завершил работу с кодом ${code}`))
}


if (squirrel) {
  app.quit()
}

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
      contentSecurityPolicy: "default-src 'self';",
      // contentSecurityPolicy:
      //   "default-src 'self' 'unsafe-inline' 'unsafe-eval';",
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

// Обработка события 'ready'
app.whenReady().then(() => {
  startServer() // ◄ ОБЯЗАТЕЛЬНО запускаем сервер тут
  createWindow()
})


// Обработка события 'activate'
app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  }
})

// Функция для красивого закрытия торрент-клиента внутри сервера
function shutdownServer() {
  if (serverProcess) {
    // Вместо вызова destroyTorrentClient() отправляем серверу системный сигнал
    serverProcess.send({ action: 'SHUTDOWN' })

    // Даем серверу немного времени на удаление файлов, затем жестко убиваем, если он завис
    setTimeout(() => {
      if (serverProcess) serverProcess.kill()
      app.quit()
    }, 2000)
  } else {
    app.quit()
  }
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    shutdownServer() // ◄ Тушим сервер перед выходом
  }
})

app.on('before-quit', () => {
  shutdownServer() // ◄ Тушим сервер перед выходом
})
