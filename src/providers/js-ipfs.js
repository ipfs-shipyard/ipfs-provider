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

async function tryJsIpfs ({ ipfsConnectionTest, getJsIpfs, jsIpfsOpts, initJsIpfs = promiseMeJsIpfs }) {
  const Ipfs = await getJsIpfs()
  const ipfs = await initJsIpfs(Ipfs, jsIpfsOpts)
  await ipfsConnectionTest(ipfs)
  return { ipfs, provider: PROVIDERS.jsipfs }
}

module.exports = tryJsIpfs
