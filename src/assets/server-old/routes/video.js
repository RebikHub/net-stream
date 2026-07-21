import { Router } from 'express'
import {
  downloadTorrent,
  streamTorrent,
  streamStats,
  streamVideo,
  addMagnet,
  stopStream,
  startPlayer
} from '../controllers/video/torrentController.js'

const router = Router()

router.post('/download', downloadTorrent)

router.get('/torrent/:id', streamTorrent)

router.get('/stream/stats/:infoHash', streamStats)

router.post('/stream/add', addMagnet)

router.get('/stream/stop/:infoHash', stopStream)

router.get('/stream/:infoHash/:name', streamVideo)

router.get('/stream/start/:link/:name', startPlayer)

export default router
