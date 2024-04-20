import { AtpAgent } from '@atproto/api'
import dotenv from 'dotenv'

import { ids } from '@/lexicon/lexicons'

const required = (value: string | undefined) => {
  if (!value) {
    throw new Error('Missing required environment variable')
  }
  return value
}

const run = async () => {
  dotenv.config()

  // YOUR bluesky handle
  // Ex: user.bsky.social
  const handle = required(process.env.PUBLISH_HANDLE)

  // YOUR bluesky password, or preferably an App Password (found in your client settings)
  // Ex: abcd-1234-efgh-5678
  const password = required(process.env.PUBLISH_PASSWORD)

  // A short name for the record that will show in urls
  // Lowercase with no spaces.
  // Ex: whats-hot
  const recordName = required(process.env.PUBLISH_RECORD_NAME)

  // -------------------------------------
  // NO NEED TO TOUCH ANYTHING BELOW HERE
  // -------------------------------------

  // only update this if in a test environment
  const agent = new AtpAgent({ service: 'https://bsky.social' })
  await agent.login({ identifier: handle, password })

  await agent.api.com.atproto.repo.deleteRecord({
    repo: agent.session?.did ?? '',
    collection: ids.AppBskyFeedGenerator,
    rkey: recordName,
  })

  console.log('All done 🎉')
}

void run()
