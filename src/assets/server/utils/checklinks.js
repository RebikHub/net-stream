import http from 'http'
import https from 'https'
import axios from 'axios'
// import { Parser } from 'm3u8-parser'
// import { writeFile } from 'fs-extra'
// import { readJson } from './readJson.js'

export async function checkUrl (url) {
  return new Promise((resolve, _reject) => {
    if (
      url.includes('rtsp:') ||
      url.includes('mmsh:') ||
      url.includes('uhttp:')
    ) {
      resolve(false)
    }
    const protocol = url.startsWith('https') ? https : http

    protocol
      .get(url, (res) => {
        const { statusCode } = res

        if (statusCode === 200) {
          console.log('link ok: ', url)
          resolve(true)
        }

        setTimeout(() => {
          if (statusCode !== 200) {
            console.log('link not response long time')
            resolve(false)
          }
        }, 1000 * 3)
      })
      .on('error', (_err) => {
        resolve(false)
        console.log('error-link')
      })
  })
}

export async function checkWorkedUrl (list, url) {
  const filteredPromises = list.map(async (item) => {
    const result = await checkUrl(item)
    return { item, result }
  })

  const filteredResults = await Promise.all(filteredPromises)

  const workedUrl = filteredResults.find(({ result }) => result)
  url = workedUrl.item
  // return workedUrl.item;
}

export async function checkUrls (list) {
  const filteredPromises = list.map(async (item) => {
    // const result = await checkUrl(item.url);
    const result = await checkM3U8Stream(item.url)
    return { item, result }
  })

  const filteredResults = await Promise.all(filteredPromises)

  const filteredArray = filteredResults
    .filter(({ result }) => result)
    .map(({ item }) => item)
  console.log('Checking complete!')
  return filteredArray
}

async function checkM3U8Stream (url) {
  try {
    const response = await axios.get(url)
    if (response.status === 200 && response.data.includes('#EXTM3U')) {
      return true
    } else {
      return false
    }
  } catch (error) {
    return false
  }
}

// async function getParserM3u8 (req, res) {
//   const item = req.params.item
//   console.log(item)
//   axios
//     .get(item)
//     .then((response) => {
//       console.log('url-response: ', response)
//       // Парсим содержимое файла M3U8
//       const parser = new Parser()
//       parser.push(response.data)
//       parser.end()
//       const parsedData = parser.manifest

//       res.status(200).json({ data: parser })
//     })
//     .catch((error) => {
//       console.error('Произошла ошибка при загрузке файла M3U8:', error)
//       res
//         .status(405)
//         .json({ error: `Произошла ошибка при загрузке файла M3U8: ${error}` })
//     })
// }
