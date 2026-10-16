let timer = null
/**
 * Ждёт готовности торрента с таймаутом.
 */
export function waitForTorrentReady(torrent, timeoutMs = 30000) {
  if (timer) clearTimeout(timer)

  return new Promise((resolve, reject) => {
    if (torrent.ready) return resolve()
    const cleanup = () => {
      // clearTimeout(timer)
      torrent.removeListener('ready', onReady)
      torrent.removeListener('error', onError)
    }
    const onReady = () => { cleanup(); resolve() }
    const onError = (err) => { cleanup(); reject(err) }

    torrent.on('ready', onReady)
    torrent.on('error', onError)

    timer = setTimeout(() => {
      cleanup()
      reject(new Error(`Timeout waiting for metadata after ${timeoutMs}ms`))
    }, timeoutMs)
  })
}
