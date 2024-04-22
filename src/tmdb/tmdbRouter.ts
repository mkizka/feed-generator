import express from 'express'

import { cache } from './cache'

export const tmdbRouter = () => {
  const router = express.Router()

  router.get('/movies', (_req, res) => {
    const cachedMovies = cache.get('movies')
    return res.json(cachedMovies)
  })

  return router
}
