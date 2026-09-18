import { fileURLToPath } from 'url'
import { resolve } from 'path'
import appExpress from './app.js'
import { PORT } from './config.js'
import { clearFolder } from './utils/clearFolder.js'
import { destroyTorrentClient } from './controllers/video/torrentController.js'
import { createContentTvFolder, createContentUrlsFolder, createDownlaodFolder } from './utils/createFolder.js'

// Создаем папки (они сами используют os.tmpdir() внутри себя)
export const WEBTORRENT_DOWNLOAD_PATH = createDownlaodFolder()
export const CONTENT_TV_PATH = createContentTvFolder()
export const CONTENT_URLS_PATH = createContentUrlsFolder()

let server = null
let isShuttingDown = false

export function startServer () {
  if (server) return server

  server = appExpress.listen(PORT, () => {
    clearFolder(WEBTORRENT_DOWNLOAD_PATH)
    console.log(`Server is running on port ${PORT}`)
  })

  return server
}

// Единая функция для безопасной очистки ресурсов и закрытия сервера
export async function stopServer (reason = 'shutdown') {
  if (!server || isShuttingDown) return

  isShuttingDown = true
  console.log(`\n[Shutdown] Получен сигнал: ${reason}. Очистка ресурсов...`)

  try {
    destroyTorrentClient()
    console.log('[Shutdown] Торрент-клиент успешно остановлен.')
  } catch (err) {
    console.error('[Shutdown] Ошибка при очистке торрентов:', err)
  }

  await new Promise((resolve) => {
    const timer = setTimeout(() => {
      console.error('[Shutdown] Принудительный выход по таймауту.')
      resolve()
    }, 3000)

    server.close(() => {
      clearTimeout(timer)
      console.log('[Shutdown] HTTP сервер остановлен. Выход.')
      resolve()
    })
  })
}

const isDirectRun = Boolean(process.argv[1]) && resolve(process.argv[1]) === fileURLToPath(import.meta.url)

if (isDirectRun) {
  startServer()
  process.on('SIGINT', () => stopServer('SIGINT (Ctrl+C)').finally(() => process.exit(0)))
  process.on('SIGTERM', () => stopServer('SIGTERM').finally(() => process.exit(0)))
}
