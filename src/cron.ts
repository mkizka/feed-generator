import { CronJob } from 'cron'

export const startCron = () => {
  const job = CronJob.from({
    cronTime: '0 * * * * *',
    onTick: () => {
      console.log('CRON実装テスト', new Date())
    },
    start: true,
    timeZone: 'Asia/Tokyo',
  })
  job.start()
}
