'use strict'

const PROVIDERS = require('../constants/providers')

function promiseMeJsIpfs (Ipfs, opts) {
  return new Promise((resolve, reject) => {
    const ipfs = new Ipfs(opts)
    ipfs.once('ready', () => resolve(ipfs))
    ipfs.once('error', err => reject(err))
  })
}

async function tryJsIpfs ({ ipfsConnectionTest, getJsIpfs, jsIpfsOpts, initJsIpfs = promiseMeJsIpfs }) {
  try {
    console.info('Fetching js-ipfs')
    const Ipfs = await getJsIpfs()
    console.info('Trying js-ipfs', jsIpfsOpts)
    const ipfs = await initJsIpfs(Ipfs, jsIpfsOpts)
    await ipfsConnectionTest(ipfs)
    console.info('js-ipfs ready!')
    return { ipfs, provider: PROVIDERS.jsipfs }
  } catch (error) {
    console.warn('Failed to initialise js-ipfs', error)
  }
}

module.exports = tryJsIpfs
