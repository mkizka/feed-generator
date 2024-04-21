import type { AppContext } from '@/config'
import type {
  OutputSchema as AlgoOutput,
  QueryParams,
} from '@/lexicon/types/app/bsky/feed/getFeedSkeleton'

import * as movies from './movies'

type AlgoHandler = (ctx: AppContext, params: QueryParams) => Promise<AlgoOutput>

const algos: Record<string, AlgoHandler> = {
  [movies.shortname]: movies.handler,
}

export default algos
