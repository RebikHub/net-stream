import path from 'node:path'
import fs from 'node:fs'
import net from 'node:net'
import tls from 'node:tls'
import { CONTENT_URLS_PATH } from '../index.js'

const urlsFilePath = () => path.join(CONTENT_URLS_PATH, 'urls.json')
const baseUrlFilePath = () => path.join(CONTENT_URLS_PATH, 'baseUrl.json')

let checkAttemptsCount = 0
const MAX_CHECK_ATTEMPTS = 2

// ─── Расширенный список SOCKS5-портов популярных клиентов ───
const PROXY_PORTS = [
  // Xray / V2Ray / v2rayN / v2rayNG
  1080, 1081, 1086, 1087, 10808, 10809, 10810, 10811,
  // Clash / Clash.Meta / Mihomo
  7890, 7891, 7892, 7893,
  // Nekoray / NekoBox
  2080, 2081, 2334, 12333, 12334, 12335,
  // v2rayN (доп.)
  16756, 20170, 20171,
  // Tor
  9050, 9150,
  // Прочее
  8889, 40000, 40001,
]

const USER_AGENT =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 ' +
  '(KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36'

function readUrlsFile () {
  try {
    const content = fs.readFileSync(urlsFilePath(), 'utf8').trim()
    return content ? JSON.parse(content) : []
  } catch {
    return []
  }
}

function readBaseUrlFile () {
  try {
    const content = fs.readFileSync(baseUrlFilePath(), 'utf8').trim()
    return content ? JSON.parse(content) : { url: '' }
  } catch {
    return { url: '' }
  }
}

// ─── helpers для HTTP ─────────────────────────────────────────
function buildHttpRequest (parsedUrl) {
  return (
    `GET ${parsedUrl.pathname}${parsedUrl.search} HTTP/1.1\r\n` +
    `Host: ${parsedUrl.hostname}\r\n` +
    `User-Agent: ${USER_AGENT}\r\n` +
    `Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8\r\n` +
    `Connection: close\r\n\r\n`
  )
}

function parseHttpResponse (buffer) {
  const firstLine = buffer.split('\r\n')[0]
  const statusCode = parseInt(firstLine.split(' ')[1], 10)
  const locationMatch = buffer.match(/location:\s*([^\r\n]+)/i)
  const location = locationMatch ? locationMatch[1].trim() : null
  return { status: statusCode, location }
}

// ─── 1) Прямой запрос (работает при системном VPN / обычном интернете) ───
function requestDirect (targetUrl) {
  return new Promise((resolve) => {
    let parsedUrl
    try {
      parsedUrl = new URL(targetUrl)
    } catch {
      return resolve({ status: 0, location: null })
    }

    const isHttps = parsedUrl.protocol === 'https:'
    const port = parsedUrl.port
      ? parseInt(parsedUrl.port, 10)
      : (isHttps ? 443 : 80)

    let buffer = ''
    let settled = false

    const finish = (result) => {
      if (settled) return
      settled = true
      try { socket.destroy() } catch {}
      resolve(result)
    }

    const onConnect = () => socket.write(buildHttpRequest(parsedUrl))
    const onData = (data) => {
      buffer += data.toString('utf8')
      if (buffer.includes('\r\n\r\n')) {
        finish(parseHttpResponse(buffer))
      }
    }

    const socket = isHttps
      ? tls.connect({
          host: parsedUrl.hostname,
          port,
          servername: parsedUrl.hostname,
          rejectUnauthorized: false,
        }, onConnect)
      : net.connect({ host: parsedUrl.hostname, port }, onConnect)

    socket.setTimeout(5000)
    socket.on('data', onData)
    socket.on('error', () => finish({ status: 0, location: null }))
    socket.on('timeout', () => finish({ status: 0, location: null }))
  })
}

// ─── 2) SOCKS5 (локальный прокси) ─────────────────────────────
function requestViaSocks5 (targetUrl, proxyPort) {
  return new Promise((resolve) => {
    let parsedUrl
    try {
      parsedUrl = new URL(targetUrl)
    } catch {
      return resolve({ status: 0, location: null })
    }

    const targetPort = parsedUrl.port
      ? parseInt(parsedUrl.port, 10)
      : (parsedUrl.protocol === 'https:' ? 443 : 80)

    const socket = new net.Socket()
    let stage = 'greeting' // greeting → connect → tls
    let settled = false

    const done = (result) => {
      if (settled) return
      settled = true
      socket.destroy()
      resolve(result)
    }

    socket.setTimeout(2500)

    socket.connect(proxyPort, '127.0.0.1', () => {
      socket.write(Buffer.from([0x05, 0x01, 0x00])) // приветствие
    })

    socket.on('data', (data) => {
      if (settled) return

      if (stage === 'greeting') {
        if (data[0] !== 0x05 || data[1] !== 0x00) {
          return done({ status: 0, location: null })
        }
        stage = 'connect'
        const hostBuffer = Buffer.from(parsedUrl.hostname)
        const portBuffer = Buffer.alloc(2)
        portBuffer.writeUInt16BE(targetPort, 0)
        const request = Buffer.concat([
          Buffer.from([0x05, 0x01, 0x00, 0x03, hostBuffer.length]),
          hostBuffer,
          portBuffer,
        ])
        socket.write(request)
        return
      }

      if (stage === 'connect') {
        if (data[0] !== 0x05 || data[1] !== 0x00) {
          return done({ status: 0, location: null })
        }
        stage = 'tls'
        socket.removeAllListeners('data')
        socket.removeAllListeners('error')
        socket.removeAllListeners('timeout')

        const tlsSocket = tls.connect({
          socket,
          servername: parsedUrl.hostname,
          rejectUnauthorized: false,
        }, () => {
          tlsSocket.write(buildHttpRequest(parsedUrl))
        })

        let buffer = ''
        let tlsSettled = false
        const tlsDone = (result) => {
          if (tlsSettled) return
          tlsSettled = true
          tlsSocket.destroy()
          resolve(result)
        }

        tlsSocket.on('data', (chunk) => {
          buffer += chunk.toString('utf8')
          if (buffer.includes('\r\n\r\n')) {
            tlsDone(parseHttpResponse(buffer))
          }
        })
        tlsSocket.on('error', () => tlsDone({ status: 0, location: null }))
        return
      }
    })

    socket.on('error', () => done({ status: 0, location: null }))
    socket.on('timeout', () => done({ status: 0, location: null }))
  })
}

// ─── Общий помощник обработки редиректа ──────────────────────
function followRedirect (result, currentUrl, list, tag) {
  let cleanLocation = result.location
  if (!cleanLocation.startsWith('http')) {
    const parsed = new URL(currentUrl)
    cleanLocation = parsed.origin + cleanLocation
  }
  const cleanFinalUrl = new URL(cleanLocation).origin
  if (!list.find((item) => item.url === cleanFinalUrl)) {
    list.push({ url: cleanFinalUrl })
    fs.writeFileSync(urlsFilePath(), JSON.stringify(list, null, 2))
  }
  console.log(`[${tag}] Редирект на: ${cleanFinalUrl}`)
  return cleanFinalUrl
}

async function checkUrl (url, depth = 0) {
  if (depth > 5) {
    console.warn(`[Check] Слишком много редиректов для: ${url}`)
    return { status: false, url: '' }
  }

  const list = readUrlsFile()

  if (url.includes('rtsp:') || url.includes('mmsh:') || url.includes('uhttp:')) {
    return { status: false, url: '' }
  }

  // 1) Прямой запрос (VPN / обычный интернет)
  try {
    const direct = await requestDirect(url)
    if (direct.status === 200) {
      console.log(`[Direct] Рабочий адрес (200): ${url}`)
      return { status: true, url }
    }
    if (direct.status >= 300 && direct.status < 400 && direct.location) {
      const nextUrl = followRedirect(direct, url, list, 'Direct')
      return await checkUrl(nextUrl, depth + 1)
    }
  } catch { /* игнорируем и пробуем через прокси */ }

  // 2) Перебор SOCKS5-портов
  for (const port of PROXY_PORTS) {
    try {
      const result = await requestViaSocks5(url, port)

      if (result.status === 200) {
        console.log(`[SOCKS5:${port}] Рабочий адрес (200): ${url}`)
        return { status: true, url }
      }
      if (result.status >= 300 && result.status < 400 && result.location) {
        const nextUrl = followRedirect(result, url, list, `SOCKS5:${port}`)
        return await checkUrl(nextUrl, depth + 1)
      }
    } catch {
      continue
    }
  }

  console.warn(`[Check] Адрес заблокирован, недоступен или прокси выключен: ${url}`)
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

  console.log('url: ', url)

  if (url !== '') {
    const result = await checkUrl(url)
    if (result.status) {
      checkAttemptsCount = 0
      return url
    }
  }

  if (checkAttemptsCount >= MAX_CHECK_ATTEMPTS) {
    console.warn(
      `[Server Core] Сервис полностью недоступен. Превышено число попыток проверки списка адресов ` +
      `(${MAX_CHECK_ATTEMPTS} круга). Поиск остановлен.`
    )
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
