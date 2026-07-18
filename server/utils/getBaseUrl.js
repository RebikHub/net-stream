import path from 'node:path'
import fs from 'node:fs'
import net from 'node:net'
import tls from 'node:tls'
import { CONTENT_URLS_PATH } from '../index.js'

const urlsFilePath = () => path.join(CONTENT_URLS_PATH, 'urls.json')
const baseUrlFilePath = () => path.join(CONTENT_URLS_PATH, 'baseUrl.json')

let checkAttemptsCount = 0
const MAX_CHECK_ATTEMPTS = 2

function readUrlsFile() {
  try {
    const content = fs.readFileSync(urlsFilePath(), 'utf8').trim()
    return content ? JSON.parse(content) : []
  } catch {
    return []
  }
}

function readBaseUrlFile() {
  try {
    const content = fs.readFileSync(baseUrlFilePath(), 'utf8').trim()
    return content ? JSON.parse(content) : { url: '' }
  } catch {
    return { url: '' }
  }
}

const PROXY_PORTS = [16756, 2334, 12334, 2080, 10808, 1080]

function requestViaSocks5(targetUrl, proxyPort) {
  return new Promise((resolve) => {
    const parsedUrl = new URL(targetUrl)
    const socket = new net.Socket()

    socket.setTimeout(2500)

    socket.connect(proxyPort, '127.0.0.1', () => {
      socket.write(Buffer.from([0x05, 0x01, 0x00]))
    })

    socket.on('data', (data) => {
      if (data[0] === 0x05 && data[1] === 0x00) {
        const hostBuffer = Buffer.from(parsedUrl.hostname)
        const portBuffer = Buffer.alloc(2)
        portBuffer.writeUInt16BE(parsedUrl.port ? parseInt(parsedUrl.port) : 443, 0)

        const request = Buffer.concat([
          Buffer.from([0x05, 0x01, 0x00, 0x03, hostBuffer.length]),
          hostBuffer,
          portBuffer
        ])
        socket.write(request)
        return
      }

      if (data[0] === 0x05 && data[1] === 0x00 && data[2] === 0x00) {
        socket.removeAllListeners('data')
        socket.removeAllListeners('error')
        socket.removeAllListeners('timeout')

        const tlsSocket = tls.connect({
          socket: socket,
          servername: parsedUrl.hostname,
          rejectUnauthorized: false
        }, () => {
          const httpRequest =
            `GET ${parsedUrl.pathname}${parsedUrl.search} HTTP/1.1\r\n` +
            `Host: ${parsedUrl.hostname}\r\n` +
            `User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36\r\n` +
            `Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8\r\n` +
            `Connection: close\r\n\r\n`

          tlsSocket.write(httpRequest)
        })

        tlsSocket.on('data', (httpData) => {
          const responseStr = httpData.toString('utf8')
          const firstLine = responseStr.split('\r\n')[0]
          const statusCode = parseInt(firstLine.split(' ')[1], 10)

          const locationMatch = responseStr.match(/location:\s*([^\r\n]+)/i)
          const location = locationMatch ? locationMatch[1].trim() : null

          tlsSocket.destroy()
          resolve({ status: statusCode, location })
        })

        tlsSocket.on('error', () => resolve({ status: 0, location: null }))
      } else {
        socket.destroy()
        resolve({ status: 0, location: null })
      }
    })

    socket.on('error', () => { socket.destroy(); resolve({ status: 0, location: null }) })
    socket.on('timeout', () => { socket.destroy(); resolve({ status: 0, location: null }) })
  })
}

async function checkUrl (url) {
  const list = readUrlsFile()

  if (url.includes('rtsp:') || url.includes('mmsh:') || url.includes('uhttp:')) {
    return { status: false, url: '' }
  }

  // Перебираем прокси-порты
  for (const port of PROXY_PORTS) {
    try {
      const result = await requestViaSocks5(url, port)

      if (result.status === 200) {
        console.log(`[Native Socket] Рабочий адрес (200) через порт ${port}: ${url}`)
        return { status: true, url }
      }

      if (result.status >= 300 && result.status < 400 && result.location) {
        let cleanLocation = result.location
        if (!cleanLocation.startsWith('http')) {
          const parsed = new URL(url)
          cleanLocation = parsed.origin + cleanLocation
        }

        const cleanFinalUrl = new URL(cleanLocation).origin
        if (!list.find((item) => item.url === cleanFinalUrl)) {
          list.push({ url: cleanFinalUrl })
          fs.writeFileSync(urlsFilePath(), JSON.stringify(list, null, 2))
        }
        console.log(`[Native Socket] Редирект на: ${cleanFinalUrl}`)
        return await checkUrl(cleanFinalUrl)
      }
    } catch {
      continue // Порт закрыт, переходим к следующему
    }
  }

  // ◄ МЫ ТУТ: Лог вызовется, если ни один порт не вернул статус 200/3xx
  console.warn(`[Native Socket] Адрес заблокирован, недоступен или прокси выключен: ${url}`)
  return { status: false, url: '' }
}

export async function updateBaseUrls () {
  const list = readUrlsFile()
  const filteredResults = []

  for (const { url } of list) {
    const result = await checkUrl(url)
    filteredResults.push(result)
  }

  const workedUrl = filteredResults.find(({ status }) => status)

  if (workedUrl?.url) {
    fs.writeFileSync(baseUrlFilePath(), JSON.stringify({ url: workedUrl.url }, null, 2))
    return workedUrl.url
  }

  return null
}

export async function getBaseUrl () {
  const { url } = readBaseUrlFile()

  if (url !== '') {
    const result = await checkUrl(url)
    if (result.status) {
      checkAttemptsCount = 0
      return url
    }
  }

  if (checkAttemptsCount >= MAX_CHECK_ATTEMPTS) {
    console.warn(`[Server Core] Сервис полностью недоступен. Превышено число попыток проверки списка адресов (${MAX_CHECK_ATTEMPTS} круга). Поиск остановлен.`)
    checkAttemptsCount = 0
    return ''
  }

  checkAttemptsCount++
  console.log(`[Server Core] Запуск круга проверки адресов №${checkAttemptsCount}`)

  await clearBaseUrl()
  const newWorkedUrl = await updateBaseUrls()

  if (newWorkedUrl) {
    checkAttemptsCount = 0
    return newWorkedUrl
  }

  return await getBaseUrl()
}

export async function clearBaseUrl () {
  fs.writeFileSync(baseUrlFilePath(), JSON.stringify({ url: '' }, null, 2))
}
