import { readFile, writeFile } from 'node:fs/promises'
import { checkUrls } from './checklinks.js'
import { CONTENT_TV_PATH } from '../index.js'

export const readJsonId = async (id) => {
  const filePath = './src/torrents/torrents.json'
  const data = await readFile(filePath, 'utf8')
  const parsedData = JSON.parse(data)
  return parsedData.find((tor) => tor.id === id)
}

export const readJson = async (path) => {
  try {
    const data = await readFile(path, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error(error)
    return null
  }
}

export const createPlaylists = async () => {
  const channels = await readJson(`${CONTENT_TV_PATH}/channels.json`)
  const streams = await readJson(`${CONTENT_TV_PATH}/streams.json`)
  const playlist = []

  streams.forEach((stream) => {
    const channel = channels.find((el) => el.id === stream.channel)
    if (channel) {
      playlist.push({
        ...channel,
        stream: {
          ...stream
        }
      })
    } else if (stream.channel.trim() === '' && stream.url !== '') {
      playlist.push({
        id: stream.url,
        name: stream.url,
        website: '',
        logo: '',
        country: 'noname',
        is_nsfw: false,
        languages: [''],
        stream: {
          url: stream.url
        }
      })
    }
  })

  // Переводим запись основного плейлиста на асинхронный вариант
  await writeFile(
    `${CONTENT_TV_PATH}/playlist.json`,
    JSON.stringify(playlist, null, 2)
  )

  const ru = playlist.filter((el) => el.country.toLowerCase() === 'ru')
  const urlsRu = ru.map((el) => ({
    id: el.id,
    name: el.name,
    logo: el.logo,
    url: el.stream.url,
    website: el.website
  }))
  await writeFile(`${CONTENT_TV_PATH}/ru.json`, JSON.stringify(urlsRu, null, 2))

  const en = playlist.filter(
    (el) => el.languages[0].toLowerCase() === 'eng' && !el.is_nsfw
  )
  const urlsEn = en.map((el) => ({
    id: el.id,
    name: el.name,
    logo: el.logo,
    url: el.stream.url,
    website: el.website
  }))
  await writeFile(`${CONTENT_TV_PATH}/en.json`, JSON.stringify(urlsEn, null, 2))

  const nsfw = playlist.filter((el) => el.is_nsfw)
  const urlsNsfw = nsfw.map((el) => ({
    id: el.id,
    name: el.name,
    logo: el.logo,
    url: el.stream.url,
    website: el.website
  }))
  await writeFile(`${CONTENT_TV_PATH}/nsfw.json`, JSON.stringify(urlsNsfw, null, 2))

  const noname = playlist.filter((el) => el.country === 'noname')
  const urlsNoname = noname.map((el) => ({
    id: el.id,
    name: el.name,
    logo: el.logo,
    url: el.stream.url,
    website: el.website
  }))
  await writeFile(
    `${CONTENT_TV_PATH}/noname.json`,
    JSON.stringify(urlsNoname, null, 2)
  )

  // Проверка ссылок (функции checkUrls выполняются последовательно, так как они тяжелые)
  const checkedRu = await checkUrls(urlsRu)
  console.log('write checkedRu')
  await writeFile(
    `${CONTENT_TV_PATH}/checkedRu.json`,
    JSON.stringify(checkedRu, null, 2)
  )

  const checkedEn = await checkUrls(urlsEn)
  console.log('write checkedEn')
  await writeFile(
    `${CONTENT_TV_PATH}/checkedEn.json`,
    JSON.stringify(checkedEn, null, 2)
  )

  const checkedNoname = await checkUrls(urlsNoname)
  console.log('write checkedNoname')
  await writeFile(
    `${CONTENT_TV_PATH}/checkedNoname.json`,
    JSON.stringify(checkedNoname, null, 2)
  )
}
