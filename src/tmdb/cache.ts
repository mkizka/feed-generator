import { createLogger } from '@/util/logger'

import { fetchRecentMoviesInJapan } from './fetchMovies'
import type { TMDBMovie } from './types'

type CacheItem = Pick<TMDBMovie, 'title' | 'release_date'>

export const cache = new Map<string, CacheItem[]>()

const logger = createLogger('cache')

export const updateTMDBCache = async () => {
  const movies = await fetchRecentMoviesInJapan()
  if (movies.isErr()) {
    console.error(movies.error)
    return
  }
  const cacheItems = movies.value.map((movie) => ({
    title: movie.title,
    release_date: movie.release_date,
  }))
  logger.info(`キャッシュ更新: (${cacheItems.length}件)`, {
    items: cacheItems,
  })
  cache.set('movies', cacheItems)
}
