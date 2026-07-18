// import path, { dirname } from 'path'
// import { fileURLToPath } from 'url'
// const __filename = fileURLToPath(import.meta.url)
// const __dirname = dirname(__filename)
export const PORT = process.env.PORT || 8000
// export const WEBTORRENT_DOWNLOAD_PATH = path.join(__dirname, '/downloads')
// export const CONTENT_TV = path.join(__dirname, '/content/tv')
// export const CONTENT_URLS = path.join(__dirname, '/content/urls')
export const TV_CHANNELS_URL = 'https://iptv-org.github.io/api/channels.json'
export const TV_STREAMS_URL = 'https://iptv-org.github.io/api/streams.json'
export const RUTOR_URL = 'https://rutor.org'

export const MAGNET_KEY = 'magnet:?xt'
export const SPLIT_MAGNET_STRING = 'urn:btih:'

export const FILTER_ARRAY = [1, 5, 7, 10, 4, 16]

export const IMDB_SEARCH_URL = 'https://api.themoviedb.org/3'

export const TORRENT_URLS = [
  { url: 'https://6-ffyg.123tt.ru' },
  { url: 'https://3-new-rutor.123rutor.su' },
  { url: 'https://9-ixwrqnqb.123tt.ru' },
  { url: 'https://9-fkqg.123tt.ru' },
  { url: 'https://6-lrea.123tt.ru' },
  { url: 'https://6-ixwrqzis.123tt.ru' },
  { url: 'https://9-ixwrqzis.123tt.ru' },
  { url: 'https://9-isqiegpg.123tt.ru' },
  { url: 'https://6-isqiegpg.123tt.ru' },
  { url: 'https://6-ixwrqzer.123tt.ru' },
  { url: 'https://rutor.org' },
  { url: 'https://9-ixwrqzer.123tt.ru' },
  { url: 'https://9-isqpykoy.123tt.ru' }
]

export const PLAYLIST_URL = 'https://raw.githubusercontent.com/blackbirdstudiorus/LoganetXIPTV/main/'

// all - LoganetXAll.m3u
// strawberry - LoganetXStrawberry.m3u
