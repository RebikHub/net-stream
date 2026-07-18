import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { PLAYLIST_URL, TV_CHANNELS_URL, TV_STREAMS_URL } from '../../config.js'
import { readJson, createPlaylists } from '../../utils/readJson.js'
import { parsePlaylist } from '../../utils/parsePlaylist.js'
import { createDownlaodFolder } from '../../utils/createFolder.js'
import { CONTENT_TV_PATH } from '../../index.js'

export const getChannelList = async (path, res) => {
  try {
    const playlist = await readJson(path)

    if (!playlist || playlist.length === 0) {
      // Запрашиваем каналы
      const channelsRes = await fetch(TV_CHANNELS_URL)
      const channelsData = await channelsRes.json()
      await writeFile(
        `${CONTENT_TV_PATH}/channels.json`,
        JSON.stringify(channelsData, null, 2)
      )

      // Запрашиваем стримы
      const streamsRes = await fetch(TV_STREAMS_URL)
      const streamsData = await streamsRes.json()
      await writeFile(
        `${CONTENT_TV_PATH}/streams.json`,
        JSON.stringify(streamsData, null, 2)
      )

      // Генерируем плейлисты
      await createPlaylists()

      // Читаем обновленный файл и отдаем клиенту
      const list = await readJson(path)
      return res.status(200).json(list)
    }

    return res.status(200).json(playlist)
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Failed to response playlist' })
  }
}

export const getPlaylistUpdate = async (req, res) => {
  try {
    // Проверяем существование папки перед записью
    if (!existsSync(CONTENT_TV_PATH)) {
      await mkdir(createDownlaodFolder(), { recursive: true })
    }

    // Скачиваем каналы
    const channelsRes = await fetch(TV_CHANNELS_URL)
    const channelsData = await channelsRes.json()
    await writeFile(
      `${CONTENT_TV_PATH}/channels.json`,
      JSON.stringify(channelsData, null, 2)
    )

    // Скачиваем и фильтруем стримы
    const streamsRes = await fetch(TV_STREAMS_URL)
    const streamsData = await streamsRes.json()
    const streamSort = streamsData.filter((stream) => /\.m3u8$/.test(stream.url))

    await writeFile(
      `${CONTENT_TV_PATH}/streams.json`,
      JSON.stringify(streamSort, null, 2)
    )

    await createPlaylists()
    return res.status(200).json({ response: 'Playlist ready!' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Failed to response playlist' })
  }
}

export const getPlaylistRu = async (req, res) => {
  await getChannelList(`${CONTENT_TV_PATH}/checkedRu.json`, res)
}

export const getPlaylistEn = async (req, res) => {
  await getChannelList(`${CONTENT_TV_PATH}/checkedEn.json`, res)
}

export const getPlaylistNoname = async (req, res) => {
  await getChannelList(`${CONTENT_TV_PATH}/checkedNoname.json`, res)
}

export const getPlaylistAll = async (req, res) => {
  try {
    const playlist = await readJson(`${CONTENT_TV_PATH}/all.json`)

    if (!playlist || playlist.length === 0) {
      const response = await fetch(PLAYLIST_URL + 'LoganetXAll.m3u')
      const textData = await response.text()

      if (textData) {
        const parsedPlaylist = parsePlaylist(textData)
        if (parsedPlaylist && parsedPlaylist.length) {
          await writeFile(
            `${CONTENT_TV_PATH}/all.json`,
            JSON.stringify(parsedPlaylist, null, 2)
          )
          return res.status(200).json(parsedPlaylist)
        }
      }
    } else {
      return res.status(200).json(playlist)
    }
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Failed to response playlist' })
  }
}

export const getPlaylistUpdateAll = async (req, res) => {
  try {
    const response = await fetch(PLAYLIST_URL + 'LoganetXAll.m3u')
    const textData = await response.text()

    if (textData) {
      const parsedPlaylist = parsePlaylist(textData)
      if (parsedPlaylist && parsedPlaylist.length) {
        await writeFile(
          `${CONTENT_TV_PATH}/all.json`,
          JSON.stringify(parsedPlaylist, null, 2)
        )
        return res.status(200).json(parsedPlaylist)
      }
    }
    return res.status(400).json({ error: 'Playlist is empty or invalid' })
  } catch (error) {
    console.error(error)
    return res.status(500).json({ error: 'Failed to response playlist' })
  }
}
