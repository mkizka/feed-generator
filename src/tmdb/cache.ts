import { createLogger } from '@/util/logger'

import { fetchRecentMoviesInJapan } from './fetchMovies'
import type { TMDBMovie } from './types'

export const cache = new Map<string, TMDBMovie[]>()

const logger = createLogger('cache')

export const updateTMDBCache = async () => {
  const movies = await fetchRecentMoviesInJapan()
  if (movies.isErr()) {
    console.error(movies.error)
    return
  }
  logger.info(`キャッシュ更新: (${movies.value.length}件)`, {
    items: movies.value,
  })
  cache.set('movies', movies.value)
}
