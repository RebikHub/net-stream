import TorrentSearchApi from 'torrent-search-api'
import parseTorrent from 'parse-torrent'
import * as cheerio from 'cheerio'
import { FILTER_ARRAY } from '../../config.js'
import { getBaseUrl } from '../../utils/getBaseUrl.js'

export const getSearchMovie = async (req, res) => {
  const movie = req.params.movie

  try {
    await TorrentSearchApi.enablePublicProviders()
    const torrents = await TorrentSearchApi.search(movie)

    return res.status(200).send(torrents)
  } catch (error) {
    console.error('Ошибка при запросе данных:', error)
    return res.status(400).send('Ошибка запроса')
  }
}

export const postSearchMagnet = async (req, res) => {
  const movie = req.body
  try {
    const torrent = await TorrentSearchApi.getMagnet(movie)
    // parseTorrent — это синхронная функция, await здесь лишний
    const magnet = parseTorrent(torrent.magnet)

    return res.status(200).json(magnet.infoHash)
  } catch (error) {
    console.error('Ошибка при запросе данных:', error)
    return res.status(400).send('Ошибка запроса')
  }
}

export const movieSearch = async (req, res) => {
  const { movie, filter } = req.params
  const BASE_URL = await getBaseUrl()

  if (!BASE_URL || BASE_URL === '') {
    console.error('[Search Error] Поиск невозможен: нет доступных рабочих зеркал.')

    return res.status(503).json({
      error: 'Сервис временно недоступен. Проверьте подключение к прокси/VPN.'
    })
  }

  try {
    const filterId = FILTER_ARRAY.includes(+filter) ? filter : 1
    const targetUrl = `${BASE_URL}/search/0/${filterId}/000/0/${movie}`

    // Используем нативный fetch вместо axios
    const response = await fetch(targetUrl)
    const htmlData = await response.text()

    const $ = cheerio.load(htmlData)
    const data = $('#index tr').toArray()

    const torrents = data
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

    return res.status(200).send(torrents)
  } catch (error) {
    console.error('Ошибка при запросе данных:', error)
    return res.status(400).send('Ошибка запроса')
  }
}

export const magnetSearch = async (req, res) => {
  const data = req.body
  const BASE_URL = await getBaseUrl()
  try {
    // Используем нативный fetch вместо axios
    const response = await fetch(`${BASE_URL}${data.data}`)
    const htmlData = await response.text()

    const $ = cheerio.load(htmlData)

    const downloadLink = $('#download a').toArray()
    const magnetLink = $(downloadLink[0]).attr('href')

    // parseTorrent — это синхронная функция, убираем await
    const magnet = parseTorrent(magnetLink)

    return res.status(200).json({ link: magnetLink, hash: magnet.infoHash })
  } catch (error) {
    console.error('Ошибка при запросе данных:', error)
    return res.status(400).send('Ошибка запроса')
  }
}
