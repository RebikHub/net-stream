import { Router } from 'express'
import {
  // getPlaylist,
  // getPlaylistUpdate,
  // getPlaylistRu,
  getPlaylistEn,
  // getPlaylistNoname,
  getPlaylistAll,
  getPlaylistUpdateAll
  // getParserM3u8,
} from '../controllers/tv/tvController.js'

const router = Router()

// router.get('/playlist', getPlaylist)

router.get('/update', getPlaylistUpdateAll)

router.get('/playlist/ru', getPlaylistAll)

// router.get('/playlist/ru', getPlaylistRu)

router.get('/playlist/en', getPlaylistEn)

// router.get('/playlist/noname', getPlaylisNoname)

// router.get('/playlist/noname', getPlaylistAll)

// router.get("/channel/:item", getParserM3u8);

export default router
