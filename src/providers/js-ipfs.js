'use strict'

const PROVIDERS = require('../constants/providers')

function createIpfs (ipfsModule, opts) {
  // Allow the use of `import` or `require` on `getJsIpfs` fn
  ipfsModule = ipfsModule.default || ipfsModule
  return ipfsModule.create(opts)
}

async function tryJsIpfs ({ connectionTest, loadJsIpfsModule, options, init = createIpfs }) {
  const ipfsModule = await loadJsIpfsModule()
  const ipfs = await init(ipfsModule, options)
  await connectionTest(ipfs)
  return { ipfs, provider: PROVIDERS.jsIpfs }
}

module.exports = tryJsIpfs
