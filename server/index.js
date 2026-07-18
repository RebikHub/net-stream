import appExpress from './app.js'
import { PORT } from './config.js'
import { clearFolder } from './utils/clearFolder.js'
import { destroyTorrentClient } from './controllers/video/torrentController.js'
import { createContentTvFolder, createContentUrlsFolder, createDownlaodFolder } from './utils/createFolder.js'

// Создаем папки (они сами используют os.tmpdir() внутри себя)
export const WEBTORRENT_DOWNLOAD_PATH = createDownlaodFolder()
export const CONTENT_TV_PATH = createContentTvFolder()
export const CONTENT_URLS_PATH = createContentUrlsFolder()

const server = appExpress.listen(PORT, () => {
  clearFolder(WEBTORRENT_DOWNLOAD_PATH)
  console.log(`Server is running on port ${PORT}`)
})

// Единая функция для безопасной очистки ресурсов и закрытия сервера
async function gracefulShutdown(reason) {
  console.log(`\n[Shutdown] Получен сигнал: ${reason}. Очистка ресурсов...`)

  try {
    destroyTorrentClient()
    console.log('[Shutdown] Торрент-клиент успешно остановлен.')
  } catch (err) {
    console.error('[Shutdown] Ошибка при очистке торрентов:', err)
  }

  server.close(() => {
    console.log('[Shutdown] HTTP сервер остановлен. Выход.')
    process.exit(0)
  })

  setTimeout(() => {
    console.error('[Shutdown] Принудительный выход по таймауту.')
    process.exit(1)
  }, 3000)
}

// 1. СЛУШАЕМ СИГНАЛЫ ОТ ELECTRON (IPC канал)
process.on('message', async (msg) => {
  if (msg && msg.action === 'SHUTDOWN') {
    await gracefulShutdown('SHUTDOWN (Electron)')
  }
})

// 2. СЛУШАЕМ СИГНАЛЫ КОНСОЛИ (Для локальной разработки через node/nodemon)
process.on('SIGINT', () => gracefulShutdown('SIGINT (Ctrl+C)'))
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'))
