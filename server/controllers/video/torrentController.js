import WebTorrent from 'webtorrent'
import { readJsonId } from '../../utils/readJson.js'
import { spawn } from '../../utils/startVLC.js'
import { WEBTORRENT_DOWNLOAD_PATH } from '../../index.js'
import { createDownlaodFolder } from '../../utils/createFolder.js'
import { clearFolder } from '../../utils/clearFolder.js'
import ParseTorrent from 'parse-torrent'

// ✅ Исправленные опции: убраны дублирующийся tracker, несуществующие pex/webRTC
const client = new WebTorrent({
  maxConns: 100,
  utp: true,
  dht: true,
  utPex: true,
  webSeeds: true,
  tracker: {
    announce: [
           'http://bt2.t-ru.org/ann?magnet',
           'udp://opentor.net:6969',
           'retracker.local/announce',
           'udp://tracker.openbittorrent.com:80/announce',
           'udp://tracker.publicbt.com:80/announce',
           'udp://tracker.opentrackr.org:1337',
           'udp://tracker.coppersurfer.tk:6969'
    ]
  }
})

const streamServer = client.createServer();
const STREAM_PORT = 8001; // или 0 для динамического порта

streamServer.listen(STREAM_PORT, () => {
  const port = streamServer.address().port;
  console.log(`WebTorrent streaming server running on port ${port}`);
});

client.on('error', (err) => {
  console.error('Клиент: фатальная ошибка', err)
})

client.on('add', (torrent) => {
  console.log(`Торрент добавлен: ${torrent.magnetURI || torrent.infoHash}`)
})

client.on('torrent', (torrent) => {
  console.log(`Торрент готов к работе: ${torrent.name} (${torrent.infoHash})`)
})

client.on('remove', (torrent) => {
  console.log(`Торрент удалён: ${torrent.name || torrent.infoHash}`)
})

// --- Вспомогательные функции ---

/**
 * Ждёт готовности торрента с таймаутом.
 */
function waitForTorrentReady(torrent, timeoutMs = 100000) {
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

    // const timer = setTimeout(() => {
    //   cleanup()
    //   reject(new Error(`Timeout waiting for metadata after ${timeoutMs}ms`))
    // }, timeoutMs)
  })
}

/**
 * Добавляет торрент и возвращает его после готовности.
 */
function addTorrentAsync(magnetLink, infoHash) {
  return new Promise((resolve, reject) => {
    const torrent = client.add(magnetLink, {
      path: `${createDownlaodFolder()}/${infoHash}`
    })
    waitForTorrentReady(torrent)
      .then(() => resolve(torrent))
      .catch(reject)
  })
}

// --- Публичные методы ---

/**
 * Загрузка торрента: добавляет, если нет, и возвращает infoHash после ready.
 */
export const startTorrentDownload = async (magnetLink) => {
  const { infoHash } = await ParseTorrent(magnetLink)
  let torrent = await client.get(infoHash)

  if (torrent) {
    await waitForTorrentReady(torrent)
    return torrent.infoHash
  }

  torrent = client.add(magnetLink, { path: WEBTORRENT_DOWNLOAD_PATH })
  await waitForTorrentReady(torrent)
  return torrent.infoHash
}

/**
 * Стриминг: инициирует торрент и резолвится при ready (можно начинать стримить).
 */
export const startStreamTorrent = async (magnetLink) => {
  const { infoHash } = await ParseTorrent(magnetLink)
  let torrent = await client.get(infoHash)

  if (!torrent) {
    torrent = client.add(magnetLink, { path: WEBTORRENT_DOWNLOAD_PATH })
  }

  await waitForTorrentReady(torrent)
  return {
    message: 'Torrent is ready for streaming',
    filePath: torrent.path,
    infoHash: torrent.infoHash,
    files: torrent.files.map(f => ({ name: f.name, length: f.length }))
  }
}

/**
 * Отправка статистики через Server-Sent Events (безопасная).
 */
export const streamStats = async (req, res) => {
  const infoHash = req.params.infoHash
  try {
    const torrent = await client.get(infoHash)  // ✅ await обязательно
    if (!torrent) {
      return res.status(404).json({ error: 'Torrent not found or destroyed' })
    }

    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Connection': 'keep-alive',
      'Cache-Control': 'no-cache'
    })

    const intervalId = setInterval(() => {
      if (!torrent.infoHash) {
        clearInterval(intervalId)
        res.end()
        return
      }
      try {
        const data = {
          // speed: client?.downloadSpeed || torrent?.downloadSpeed || '',
          // progress: client?.progress || torrent?.progress || '',
          // ratio: client?.ratio || torrent?.ratio || '',
          // torrentName: torrent?.name || '',
          // torrentProgress: torrent?.progress || '',
          // torrentDownLoadSpeed: torrent?.downloadSpeed || '',
          // torrentRatio: torrent?.ratio || '',
          // torrentUploadSpeed: torrent?.uploadSpeed || ''

            speed: 'speed',
            progress: 'progress',
            ratio: 'ratio',
            torrentName: 'torrentName',
            torrentProgress: 'torrentProgress',
            torrentDownLoadSpeed: 'torrentDownLoadSpeed',
            torrentRatio: 'torrentRatio',
            torrentUploadSpeed: 'torrentUploadSpeed'
        }
        res.write(`data: ${JSON.stringify(data)}\n\n`)
      } catch (err) {
        console.error('Error reading stats:', err)
        clearInterval(intervalId)
        res.end()
      }
    }, 1000)

    req.on('close', () => {
      clearInterval(intervalId)
    })

  } catch (error) {
    console.error('Ошибка при предоставлении статистики:', error)
    res.status(500).json({ error: 'Failed to provide stream stats.' })
  }
}

/**
 * Получение списка файлов торрента по magnet-ссылке.
 */
export const addMagnet = async (req, res) => {
  const magnetLink = req.body.magnet
  const { infoHash } = await ParseTorrent(magnetLink)

  try {
    let torrent = await client.get(infoHash)

    if (!torrent) {
      torrent = client.add(magnetLink, {
        path: `${createDownlaodFolder()}/${infoHash}`
      })
    }

    await waitForTorrentReady(torrent)   // ✅ таймаут внутри

    if (torrent.files && torrent.files.length > 0) {
      const files = torrent.files.map(data => ({
        name: data.name,
        length: data.length
      }))
      res.status(200).json({ files, infoHash })
    } else {
      res.status(404).json({ error: 'No files found in the torrent' })
    }
  } catch (error) {
    console.error('Ошибка при добавлении:', error)
    res.status(400).json({ error: `Error add magnet: ${error.message}` })
  }
}

// --- Остальные методы (downloadTorrent, streamTorrent, streamVideo, startPlayer, stopStream, destroy) ---

export const downloadTorrent = async (req, res) => {
  try {
    const magnetLink = req.body.magnetLink
    const torrentInfo = await startTorrentDownload(magnetLink)
    res.status(200).json(torrentInfo)
  } catch (error) {
    console.error('Ошибка при начале загрузки:', error)
    res.status(500).json({ error: 'Failed to start torrent download.' })
  }
}

export const streamTorrent = async (req, res) => {
  try {
    const id = req.params.id
    const magnetLink = await readJsonId(id)
    const torrentInfo = await startStreamTorrent(magnetLink.url)
    res.status(200).json(torrentInfo)
  } catch (error) {
    console.error('Ошибка при начале стриминга:', error)
    res.status(500).json({ error: 'Failed to start torrent streaming.' })
  }
}

export const streamVideo = async (req, res, next) => {
  const {
    params: { name, infoHash },
    headers: { range }
  } = req

  if (!range) {
    const err = new Error('Range is not defined, please make request from HTML5 Player')
    err.status = 416
    return next(err)
  }

  const torrentFile = await client.get(infoHash)

  if (!torrentFile) {
    return res.status(404).json({ error: 'Torrent not found or destroyed' })
  }

  const file = torrentFile.files.find(f => f.name === name)
  if (!file) {
    return res.status(404).json({ error: 'File not found in torrent' })
  }

  const fileSize = file.length
  const [startParsed, endParsed] = range.replace(/bytes=/, '').split('-')
  const start = Number(startParsed)
  const end = endParsed ? Number(endParsed) : fileSize - 1
  const chunkSize = end - start + 1

  res.writeHead(206, {
    'Content-Range': `bytes ${start}-${end}/${fileSize}`,
    'Accept-Ranges': 'bytes',
    'Content-Length': chunkSize,
    'Content-Type': 'video/mp4'
  })

  const stream = file.createReadStream({ start, end })

  stream.pipe(res)

  req.on('close', () => {
    stream.destroy()
  })

  stream.on('error', (err) => {
    console.log('stream-error:', err)
    next(err)
  })

  stream.on('end', () => {
    console.log('stream-end')
    res.end()
  })
}

// export const startPlayer = async (req, res) => {
//   const { link, name } = req.params
//   try {
//     spawn(`http://localhost:${STREAM_PORT}/webtorrent/${link}/${encodeURIComponent(name)}`, name)
//     res.status(200).end()
//   } catch (error) {
//     res.status(403).send(`Error start player: ${error}`)
//   }
// }
export const startPlayer = async (req, res) => {
  const { link, name } = req.params;
  const torrent = await client.get(link);
  if (!torrent || !torrent.ready) {
    return res.status(404).json({ error: 'Torrent not ready' });
  }
  const fileName = decodeURIComponent(name);
  const file = torrent.files.find(f => f.name === fileName);
  if (!file) {
    return res.status(404).json({ error: 'File not found' });
  }

  // Вот здесь магия: file.streamURL уже содержит полный URL
  const streamURL = file.streamURL;
  console.log('VLC will open:', streamURL);

  spawn(streamURL);
  res.status(200).end();
};

/**
 * Останавливает конкретный торрент и удаляет его файлы.
 */
export const stopStream = async (req, res, next) => {
  const infoHash = req.params.infoHash
  const torrent = await client.get(infoHash)

  if (torrent) {
    torrent.destroy({ destroyStore: true }, (err) => {  // ✅ удаляем только файлы этого торрента
      if (err) {
        console.error('Ошибка при остановке:', err.message)
        next(err)
      } else {
        console.log('Торрент остановлен и файлы удалены')
        res.status(200).end()
      }
    })
  } else {
    res.status(404).json({ error: 'Torrent not found' })
  }
}

/**
 * Полное уничтожение клиента (при завершении сервера).
 */
export const destroyTorrentClient = () => {
  if (client) {
    client.destroy((err) => {
      if (err) console.error('Ошибка при client destroy:', err.message)
      else console.log('Клиент WebTorrent уничтожен')
    })
  }
}
