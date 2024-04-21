import { http, HttpResponse } from 'msw'
import { err, ok } from 'neverthrow'
import { setTimeout } from 'timers/promises'
import { describe, expect, test, vi } from 'vitest'

import { server } from '@/mocks/server'

import { fetchRecentMoviesInJapan } from './fetchMovies'

vi.mock('timers/promises')
const mockedSetTimeout = vi.mocked(setTimeout)

const dummyTMDBHandler = (dummyMovies: unknown[][]) => {
  return http.get(
    'https://api.themoviedb.org/3/discover/movie',
    ({ request }) => {
      const url = new URL(request.url)
      const page = Number(url.searchParams.get('page'))
      expect(url.searchParams.get('release_date.gte')).toBe('2023-12-30')
      expect(url.searchParams.get('release_date.lte')).toBe('2024-01-06')
      return HttpResponse.json({
        page,
        results: dummyMovies[page - 1],
        total_pages: dummyMovies.length,
        total_results: dummyMovies.flat().length,
      })
    },
  )
}

vi.useFakeTimers()
vi.setSystemTime(new Date('2024-01-06'))

describe('fetchMovies', () => {
  test('TMDB APIを叩いて映画の配列を返す', async () => {
    // arrange
    const dummyMovies = [
      [
        {
          title: '映画1',
          release_date: '2021-01-01',
        },
      ],
    ]
    server.use(dummyTMDBHandler(dummyMovies))
    // act
    const response = await fetchRecentMoviesInJapan()
    // assert
    expect(response).toEqual(ok(dummyMovies.flat()))
    expect(mockedSetTimeout).toHaveBeenCalledTimes(0)
  })
  test('TMDB APIが2ページ以上を返す場合はページネーションして返す', async () => {
    // arrange
    const dummyMovies = [
      [
        {
          title: '映画1',
          release_date: '2021-01-01',
        },
      ],
      [
        {
          title: '映画2',
          release_date: '2021-01-02',
        },
      ],
    ]
    server.use(dummyTMDBHandler(dummyMovies))
    // act
    const response = await fetchRecentMoviesInJapan()
    // assert
    expect(response).toEqual(ok(dummyMovies.flat()))
    expect(mockedSetTimeout).toHaveBeenCalledTimes(1)
  })
  test('TMDB APIが11ページ以上ある場合は10ページまで取得して返す', async () => {
    // arrange
    const dummyMovies = new Array(20).fill([
      {
        title: '映画1',
        release_date: '2021-01-01',
      },
    ]) as unknown[][]
    server.use(dummyTMDBHandler(dummyMovies))
    // act
    const response = await fetchRecentMoviesInJapan()
    // assert
    expect(response._unsafeUnwrap().length).toBe(10)
    expect(mockedSetTimeout).toHaveBeenCalledTimes(9)
  })
  test('TMDB APIがエラーを返す場合はエラーを返す', async () => {
    // arrange
    server.use(
      http.get(
        'https://api.themoviedb.org/3/discover/movie',
        () => new Response('Internal Server Error', { status: 500 }),
      ),
    )
    // act
    const response = await fetchRecentMoviesInJapan()
    // assert
    expect(response).toEqual(
      err(new Error('TMDB APIとの通信エラー(status: 500)')),
    )
  })
  test('TMDB APIがJSONを返さない場合はエラーを返す', async () => {
    // arrange
    server.use(
      http.get(
        'https://api.themoviedb.org/3/discover/movie',
        () => new Response('text', { status: 200 }),
      ),
    )
    // act
    const response = await fetchRecentMoviesInJapan()
    // assert
    expect(response).toEqual(err(new Error('TMDB APIからのJSONパースエラー')))
  })
})
