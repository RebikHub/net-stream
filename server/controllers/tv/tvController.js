import axios from 'axios'
import { PLAYLIST_URL, TV_CHANNELS_URL, TV_STREAMS_URL } from '../../config.js'
import { readJson, createPlaylists } from '../../utils/readJson.js'
import fsExtra from 'fs-extra'
import { parsePlaylist } from '../../utils/parsePlaylist.js'

import { createDownlaodFolder } from '../../utils/createFolder.js'
import { CONTENT_TV_PATH } from '../../../index.mjs'

const { existsSync, mkdirSync, writeFileSync } = fsExtra

export const getChannelList = async (path, res) => {
  try {
    const playlist = await readJson(path)
    if (!playlist || playlist.length === 0) {
      axios.get(TV_CHANNELS_URL).then(({ data }) => {
        writeFileSync(
          `${CONTENT_TV_PATH}/channels.json`,
          JSON.stringify(data, null, 2)
        )
        axios
          .get(TV_STREAMS_URL)
          .then(({ data }) => {
            writeFileSync(
              `${CONTENT_TV_PATH}/streams.json`,
              JSON.stringify(data, null, 2)
            )
            createPlaylists()
          })
          .then(async () => {
            const list = await readJson(path)
            res.status(200).json(list)
          })
      })
    } else {
      res.status(200).json(playlist)
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to response playlist' })
  }
}

export const getPlaylistUpdate = async (req, res) => {
  try {
    axios.get(TV_CHANNELS_URL).then(({ data }) => {
      mkdirSync(`${!existsSync(CONTENT_TV_PATH) ? createDownlaodFolder() : CONTENT_TV_PATH}/channels.json`)

      writeFileSync(
        `${CONTENT_TV_PATH}/channels.json`,
        JSON.stringify(data, null, 2)
      )

      axios.get(TV_STREAMS_URL).then(({ data }) => {
        const streamSort = data.filter((stream) => {
          return /\.m3u8$/.test(stream.url)
        })
        writeFileSync(
          `${CONTENT_TV_PATH}/streams.json`,
          JSON.stringify(streamSort, null, 2)
        )
        createPlaylists()
        res.status(200).json({ response: 'Playlist ready!' })
      })
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to response playlist' })
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
      axios.get(PLAYLIST_URL + 'LoganetXAll.m3u').then((response) => {
        if (response.data) {
          const playlist = parsePlaylist(response.data)
          if (playlist && playlist.length) {
            writeFileSync(
            `${CONTENT_TV_PATH}/all.json`,
            JSON.stringify(playlist, null, 2)
            )
            res.status(200).json(playlist)
          }
        }
      })
    } else {
      res.status(200).json(playlist)
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to response playlist' })
  }
}

export const getPlaylistUpdateAll = async (req, res) => {
  try {
    axios.get(PLAYLIST_URL + 'LoganetXAll.m3u').then((response) => {
      if (response.data) {
        const playlist = parsePlaylist(response.data)
        if (playlist && playlist.length) {
          writeFileSync(
            `${CONTENT_TV_PATH}/all.json`,
            JSON.stringify(playlist, null, 2)
          )
          res.status(200).json(playlist)
        }
      }
    })
  } catch (error) {
    res.status(500).json({ error: 'Failed to response playlist' })
  }
}
