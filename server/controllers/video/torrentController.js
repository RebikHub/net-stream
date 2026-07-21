import WebTorrent from 'webtorrent'
import { readJsonId } from '../../utils/readJson.js'
import { spawn } from '../../utils/startVLC.js'
import { WEBTORRENT_DOWNLOAD_PATH } from '../../index.js'
import { createDownlaodFolder } from '../../utils/createFolder.js'
import { clearFolder } from '../../utils/clearFolder.js'
import ParseTorrent from 'parse-torrent'

// magnet:?xt=urn:btih:566eb622fa7e3eea95a4acef2bf9a3e8b8bdb02d&dn=rutor.info_%D0%9C%D0%B0%D0%BD%D0%B4%D0%B0%D0%BB%D0%BE%D1%80%D0%B5%D1%86+%D0%B8+%D0%93%D1%80%D0%BE%D0%B3%D1%83+%2F+The+Mandalorian+%26+Grogu+%282026%29+WEB-DL+1080p+%D0%BE%D1%82+EniaHD+%7C+D+%7C+MovieDalen+%7C+IMAX&tr=udp://opentor.net:6969&tr=http://retracker.local/announce

const client = new WebTorrent({
  maxConns: 100,
  utp: true,
  dht: true,
  utPex: true,
  webSeeds: false,
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

const streamServer = client.createServer({}, 'node');
const STREAM_PORT = 8001; // или 0 для динамического порта

streamServer.listen(STREAM_PORT, () => {
  const port = streamServer.address().port;
  console.log(`WebTorrent streaming server running on port ${port}`);
});

client.on('error', (err) => {
  console.error('event-log-error: Клиент: фатальная ошибка', err)
})

client.on('add', (torrent) => {
  console.log(`event-log-add: Торрент добавлен: ${torrent.magnetURI || torrent.infoHash}`)
})

client.on('torrent', (torrent) => {
  console.log(`event-log-torrent: Торрент готов к работе: ${torrent.name} (${torrent.infoHash})`)

  console.log(`[Torrent] Инициализирован. InfoHash: ${torrent.infoHash}`);

  torrent.on('ready', () => {
    console.log('[Torrent] Готов к работе. Метаданные загружены.');
  });

  torrent.on('download', (bytes) => {
    // Включайте только для отладки, создает много спама в консоли
    // console.log(`[Torrent] Скачано байт: ${bytes}.`);
  });

  torrent.on('wire', (wire, addr) => {
    // console.log(`[Torrent] Подключился новый пир: ${addr}`);
  });

  torrent.on('warning', (err) => {
    console.warn('[Torrent] Предупреждение (не критично):', err.message);
  });

  torrent.on('error', (err) => {
    console.error('[Torrent] Критическая ошибка:', err.message);
  });

  torrent.on('close', () => {
    console.log('[Torrent] Полностью закрыт, ресурсы освобождены.');
  });

})

client.on('remove', (torrent) => {
  console.log(`event-log-remove: Торрент удалён: ${torrent.name || torrent.infoHash}`)
})

// --- Вспомогательные функции ---

/**
 * Ждёт готовности торрента с таймаутом.
 */
function waitForTorrentReady(torrent, timeoutMs = 100000) {
  torrent.on('metadata', () => {
    console.log('[Torrent] Метаданные загружены.');

  })
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
          speed: client?.downloadSpeed || torrent?.downloadSpeed || '',
          progress: client?.progress || torrent?.progress || '',
          ratio: client?.ratio || torrent?.ratio || '',
          torrentName: torrent?.name || '',
          torrentProgress: torrent?.progress || '',
          torrentDownLoadSpeed: torrent?.downloadSpeed || '',
          torrentRatio: torrent?.ratio || '',
          torrentUploadSpeed: torrent?.uploadSpeed || ''
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
  const parseTorrent = await ParseTorrent(magnetLink)
  const { infoHash } = parseTorrent

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

export const getStreamLink = async (link, name) => {
  try {
    const fileName = decodeURIComponent(name);
    let torrent = await client.get(link);
    if (!torrent) {
      console.log(`[Player] Торрент не найден. Добавляем: ${link}`);
      torrent = client.add(link);
    }
    if (!torrent.ready) {
      console.log('[Player] Ожидаем загрузки метаданных...');
      await new Promise((resolve) => {
        torrent.on('ready', resolve);
      });
    }
    const file = torrent.files.find(f => f.name === fileName);
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }
    file.select();
    let safePath = file.streamURL.replace(/\\/g, '/');
    safePath = safePath.split('/').map(segment => encodeURIComponent(segment)).join('/');
    const absoluteStreamURL = `http://localhost:${STREAM_PORT}${safePath}`;
    return absoluteStreamURL;
  } catch (err) {
    console.error('[Player Error]:', err);
    return null;
  }
}

export const startPlayer = async (req, res) => {
    const { link, name } = req.params;
    const absoluteStreamURL = await getStreamLink(link, name);
    if (!absoluteStreamURL) {
      return res.status(500).json({ error: 'Failed to get stream link' });
    }
    spawn(absoluteStreamURL);
    return res.status(200).json({ success: true, url: absoluteStreamURL });
};

export const getLinkForPlayer = async (req, res) => {
    const { link, name } = req.params;
    const absoluteStreamURL = await getStreamLink(link, name);
    if (!absoluteStreamURL) {
      return res.status(500).json({ error: 'Failed to get stream link' });
    }
    return res.status(200).json({ success: true, url: absoluteStreamURL });
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
