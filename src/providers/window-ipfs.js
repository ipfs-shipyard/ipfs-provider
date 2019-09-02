'use strict'

const PROVIDERS = require('../constants/providers')

async function tryWindow ({ root, permissions, ipfsConnectionTest }) {
  if (root.ipfs) {
    // https://github.com/ipfs-shipyard/ipfs-companion/issues/589
    const ipfs = typeof root.ipfs.enable === 'function'
      ? await root.ipfs.enable(permissions)
      : root.ipfs
    await ipfsConnectionTest(ipfs)
    return { ipfs, provider: PROVIDERS.window }
  }
}

module.exports = tryWindow
