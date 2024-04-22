import { format, isWithinInterval } from 'date-fns'
import { addDays, addHours } from 'date-fns/fp'
import { err, ok, ResultAsync } from 'neverthrow'
import { setTimeout } from 'timers/promises'

import { env } from '@/util/env'
import { createLogger } from '@/util/logger'

import type { TMDBMovie } from './types'

const logger = createLogger('fetchMovies')

type TMDBMovieResponse = {
  page: number
  results: TMDBMovie[]
  total_pages: number
  total_results: number
}

const getJSTDate = (relativeDate: number) => {
  return ok(new Date())
    .map(addHours(9))
    .map(addDays(relativeDate))
    ._unsafeUnwrap()
}

const fetchRecentMoviesInJapanByPage = async (
  page: number,
  options: {
    start: Date
    end: Date
  },
) => {
  const url = new URL('https://api.themoviedb.org/3/discover/movie')
  url.searchParams.set('language', 'ja-JP')
  url.searchParams.set('region', 'JP')
  url.searchParams.set('release_date.gte', format(options.start, 'yyyy-MM-dd'))
  url.searchParams.set('release_date.lte', format(options.end, 'yyyy-MM-dd'))
  url.searchParams.set('page', String(page))
  logger.info(`fetch: ${url.toString()}`)
  return ResultAsync.fromPromise(
    fetch(url, {
      headers: {
        Authorization: `Bearer ${env.TMDB_AUTH_TOKEN}`,
      },
    }),
    (error) => new Error(`TMDB APIエラー`, { cause: error }),
  ).andThen((response) => {
    if (!response.ok) {
      return err(
        new Error(`TMDB APIとの通信エラー(status: ${response.status})`),
      )
    }
    return ResultAsync.fromPromise(
      response.json() as Promise<TMDBMovieResponse>,
      () => new Error('TMDB APIからのJSONパースエラー'),
    )
  })
}

// 過剰に通信が発生しないようにするため最大ページネーション数を設定
const MAX_PAGINATION = 10

export const fetchRecentMoviesInJapan = async () => {
  let page = 1
  const movies: TMDBMovie[] = []
  const options = {
    start: getJSTDate(-30),
    end: getJSTDate(30),
  }
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const response = await fetchRecentMoviesInJapanByPage(page, options)
    if (response.isErr()) {
      return err(response.error)
    }
    movies.push(
      ...response.value.results.filter(
        // なぜか期間外の映画が返されることがあるのでフィルタする
        (movie) => isWithinInterval(movie.release_date, options),
      ),
    )
    if (page >= MAX_PAGINATION || page >= response.value.total_pages) {
      break
    }
    page = response.value.page + 1
    await setTimeout(1000) // 連続でリクエストしないように1秒待つ
  }
  return ok(movies)
}
