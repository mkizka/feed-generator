const { build } = require('esbuild')
const pkg = require('./package.json')

build({
  entryPoints: ['src/index.ts'],
  outdir: 'dist',
  bundle: true,
  platform: 'node',
  external: Object.keys(pkg.dependencies),
})
