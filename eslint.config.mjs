import { mkizka } from '@mkizka/eslint-config'

export default [
  {
    ignores: ['src/lexicon/', 'dist'],
  },
  ...mkizka(),
]
