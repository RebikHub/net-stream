import TorrentSearchApi from 'torrent-search-api'
import parseTorrent from 'parse-torrent'

import axios from 'axios'
import * as cheerio from 'cheerio'
import { FILTER_ARRAY } from '../../config.js'
import { getBaseUrl } from '../../utils/getBaseUrl.js'

export const getSearchMovie = async (req, res) => {
  const movie = req.params.movie

  try {
    await TorrentSearchApi.enablePublicProviders()

    const torrents = await TorrentSearchApi.search(movie)

    res.status(200).send(torrents)
  } catch (error) {
    console.error('Ошибка при запросе данных:', error)
    res.status(400).send('Ошибка запроса')
  }
}

export const postSearchMagnet = async (req, res) => {
  const movie = req.body
  try {
    const torrent = await TorrentSearchApi.getMagnet(movie)
    const magnet = await parseTorrent(torrent.magnet)

    res.status(200).json(magnet.infoHash)
  } catch (error) {
    console.error('Ошибка при запросе данных:', error)
    res.status(400).send('Ошибка запроса')
  }
}

export const movieSearch = async (req, res) => {
  const { movie, filter } = req.params
  const BASE_URL = await getBaseUrl()

  try {
    const searchResult = await axios.get(
      `${BASE_URL}/search/0/${
        FILTER_ARRAY.includes(+filter) ? filter : 1
      }/000/0/${movie}`
    )
    const $ = cheerio.load(searchResult.data)

    const data = $('#index tr').toArray()

    const torrents = [
      ...data
        .map((item) => {
          const [date, links, , gb, seeds] = $(item).find('td').toArray()
          const [, title] = $(links).find('a').toArray()

          const trackerLink = $(title).attr('href')
          const name = $(title).text()
          const dateText = $(date).text()
          const gbText = $(gb).text()
          const [green, red] = $(seeds).find('span').toArray()
          const ratio = {
            seed: $(green).text(),
            leech: $(red).text()
          }

          return {
            urlTorrent: trackerLink,
            nameTorrent: name,
            dateTorrent: dateText,
            gbTorrent: gbText,
            ratio,
            seeds: `${ratio.seed}/${ratio.leech}`
          }
        })
        .filter(
          (item) =>
            item.urlTorrent && (item.ratio.seed > 0 || item.ratio.leech > 0)
        )
    ]

    res.status(200).send(torrents)
  } catch (error) {
    console.error('Ошибка при запросе данных:', error)
    res.status(400).send('Ошибка запроса')
  }
}

export const magnetSearch = async (req, res) => {
  const data = req.body
  const BASE_URL = await getBaseUrl()
  try {
    const searchResult = await axios.get(`${BASE_URL}${data.data}`)
    const $ = cheerio.load(searchResult.data)

    const downloadLink = $('#download a').toArray()
    const magnetLink = $(downloadLink[0]).attr('href')
    const magnet = await parseTorrent(magnetLink)

    res.status(200).json({ link: magnetLink, hash: magnet.infoHash })
  } catch (error) {
    console.error('Ошибка при запросе данных:', error)
    res.status(400).send('Ошибка запроса')
  }
}
