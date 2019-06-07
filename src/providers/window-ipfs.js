'use strict'

const PROVIDERS = require('../constants/providers')

async function tryWindow ({ root, ipfsConnectionTest }) {
  if (root.ipfs) {
    await ipfsConnectionTest(root.ipfs)
    return { ipfs: root.ipfs, provider: PROVIDERS.window }
  }
}

module.exports = tryWindow
