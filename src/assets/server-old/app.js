import express from 'express'
import cors from 'cors'
import apiTvRoutes from './routes/tv.js'
import apiVideoRoutes from './routes/video.js'
import apiSearchRoutes from './routes/search.js'

const app = express()

app.use(cors())
app.use(express.json())
app.use('/api/tv', apiTvRoutes)
app.use('/api/video', apiVideoRoutes)
app.use('/api/search', apiSearchRoutes)

export default app
