import { CronJob } from 'cron'

import { updateTMDBCache } from './tmdb/cache'
import { env } from './util/env'

const cronTimes = {
  // 1分に1回実行
  development: '0 */1 * * * *',
  // 毎日午前0時10分に実行
  production: '0 10 0 * * *',
  // productionと同じ
  test: '0 10 0 * * *',
} satisfies Record<typeof env.NODE_ENV, string>

export const startCron = () => {
  const job = CronJob.from({
    cronTime: cronTimes[env.NODE_ENV],
    onTick: () => {
      void updateTMDBCache()
    },
    timeZone: 'Asia/Tokyo',
  })
  job.start()
}
