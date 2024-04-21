import { err, ok, ResultAsync } from 'neverthrow'
import { setTimeout } from 'timers/promises'

import { env } from '@/util/env'

type TMDBMovie = {
  adult: boolean
  backdrop_path: string
  genre_ids: number[]
  id: number
  original_language: string
  original_title: string
  overview: string
  popularity: number
  poster_path: string
  release_date: string
  title: string
  video: boolean
  vote_average: number
  vote_count: number
}

type TMDBMovieResponse = {
  page: number
  results: TMDBMovie[]
  total_pages: number
  total_results: number
}

const getJSTDateText = (relativeDate: number) => {
  const date = new Date()
  date.setDate(date.getDate() + relativeDate)
  date.setHours(date.getHours() + 9)
  return date.toISOString().split('T')[0]
}

const fetchRecentMoviesInJapanByPage = async (page: number) => {
  const url = new URL('https://api.themoviedb.org/3/discover/movie')
  url.searchParams.set('language', 'ja-JP')
  url.searchParams.set('region', 'JP')
  url.searchParams.set('release_date.gte', getJSTDateText(-7))
  url.searchParams.set('release_date.lte', getJSTDateText(0))
  url.searchParams.set('page', String(page))
  console.log('fetch', url.toString())
  return ResultAsync.fromPromise(
    fetch(url, {
      headers: {
        Authorization: `Bearer ${env.TMDB_AUTH_TOKEN}`,
      },
    }),
    (error: Error) => new Error(`TMDB APIエラー(${error.message})`),
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
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const response = await fetchRecentMoviesInJapanByPage(page)
    if (response.isErr()) {
      return err(response.error)
    }
    movies.push(...response.value.results)
    if (page >= MAX_PAGINATION || page >= response.value.total_pages) {
      break
    }
    page = response.value.page + 1
    await setTimeout(1000) // 連続でリクエストしないように1秒待つ
  }
  return ok(movies)
}
