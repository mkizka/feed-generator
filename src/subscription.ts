import type { OutputSchema as RepoEvent } from './lexicon/types/com/atproto/sync/subscribeRepos'
import { isCommit } from './lexicon/types/com/atproto/sync/subscribeRepos'
import { cache } from './tmdb/cache'
import { FirehoseSubscriptionBase, getOpsByType } from './util/subscription'

export class FirehoseSubscription extends FirehoseSubscriptionBase {
  async handleEvent(evt: RepoEvent) {
    if (!isCommit(evt)) return
    const ops = await getOpsByType(evt)

    const postsToDelete = ops.posts.deletes.map((del) => del.uri)
    const cachedMoviesTitle =
      cache.get('movies')?.map((movie) => movie.title) ?? []
    const postsToCreate = ops.posts.creates
      .filter((create) => {
        return cachedMoviesTitle.some((title) =>
          create.record.text.includes(title),
        )
      })
      .map((create) => {
        return {
          uri: create.uri,
          cid: create.cid,
          replyParent: create.record?.reply?.parent.uri ?? null,
          replyRoot: create.record?.reply?.root.uri ?? null,
          indexedAt: new Date().toISOString(),
        }
      })

    if (postsToDelete.length > 0) {
      await this.db
        .deleteFrom('post')
        .where('uri', 'in', postsToDelete)
        .execute()
    }
    if (postsToCreate.length > 0) {
      await this.db
        .insertInto('post')
        .values(postsToCreate)
        .onConflict((oc) => oc.doNothing())
        .execute()
    }
  }
}
