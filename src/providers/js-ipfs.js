'use strict'

const PROVIDERS = require('../constants/providers')

function promiseMeJsIpfs (Ipfs, opts) {
  // Allow the use of `import` or `require` on `getJsIpfs` fn
  Ipfs = Ipfs.default || Ipfs
  return new Promise((resolve, reject) => {
    const ipfs = new Ipfs(opts)
    ipfs.once('ready', () => resolve(ipfs))
    ipfs.once('error', err => reject(err))
  })
}

async function tryJsIpfs ({ connectionTest, getConstructor, options, init = promiseMeJsIpfs }) {
  const Ipfs = await getConstructor()
  const ipfs = await init(Ipfs, options)
  await connectionTest(ipfs)
  return { ipfs, provider: PROVIDERS.jsipfs }
}

module.exports = tryJsIpfs
