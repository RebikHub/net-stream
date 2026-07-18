import { Router } from 'express'
import {
  getSearchMovie,
  magnetSearch,
  movieSearch,
  postSearchMagnet
} from '../controllers/search/searchController.js'

const router = Router()

// en torrent-api

router.get('/en/:movie', getSearchMovie)

router.post('/en/magnet', postSearchMagnet)

router.get('/ru/:filter/:movie', movieSearch)

router.post('/ru/magnet', magnetSearch)

export default router
