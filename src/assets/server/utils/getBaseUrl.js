import http from 'http'
import https from 'https'
import fsExtra from 'fs-extra'
import { CONTENT_URLS_PATH } from '../../index.mjs'

const { writeFileSync, readFileSync } = fsExtra

async function checkUrl (url) {
  const list = await JSON.parse(
    readFileSync(`${CONTENT_URLS_PATH}/urls.json`, 'utf8')
  )
  return new Promise((resolve, reject) => {
    if (
      url.includes('rtsp:') ||
      url.includes('mmsh:') ||
      url.includes('uhttp:')
    ) {
      resolve({ status: false, url: '' })
    }
    const protocol = url.startsWith('https') ? https : http

    protocol
      .get(url, (res) => {
        const { statusCode } = res

        if (statusCode === 200) {
          resolve({ status: true, url })
        } else if (
          statusCode >= 300 &&
          statusCode < 400 &&
          res.headers.location
        ) {
          if (!list.find(({ url }) => url === res.headers.location)) {
            list.push({ url: res.headers.location })
            writeFileSync(
              `${CONTENT_URLS_PATH}/urls.json`,
              JSON.stringify(list, null, 2)
            )
          }

          checkUrl(res.headers.location).then(resolve)
        } else {
          setTimeout(() => {
            resolve({ status: false, url: '' })
          }, 1000 * 3)
        }
      })
      .on('error', (err) => {
        console.error(err)
        resolve({ status: false, url: '' })
      })
  })
}

export async function updateBaseUrls () {
  const list = await JSON.parse(
    readFileSync(`${CONTENT_URLS_PATH}/urls.json`, 'utf8')
  )

  const filteredResults = await Promise.all([...list.map(async ({ url }) => {
    const result = await checkUrl(url)
    return result
  })])

  const workedUrl = filteredResults.find(({ status }) => status)

  if (workedUrl?.url) {
    writeFileSync(
      `${CONTENT_URLS_PATH}/baseUrl.json`,
      JSON.stringify({ url: workedUrl.url }, null, 2)
    )
  }
}

export async function getBaseUrl () {
  const { url } = await JSON.parse(
    readFileSync(`${CONTENT_URLS_PATH}/baseUrl.json`, 'utf8')
  )
  if (url !== '') {
    const result = await checkUrl(url)
    if (result.status && result.url) {
      return url
    }
    return url
  }

  await clearBaseUrl()

  await updateBaseUrls()

  return await getBaseUrl()
}

export async function clearBaseUrl () {
  writeFileSync(
    `${CONTENT_URLS_PATH}/baseUrl.json`,
    JSON.stringify({ url: '' }, null, 2)
  )
}
