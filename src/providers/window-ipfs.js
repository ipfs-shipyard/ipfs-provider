'use strict'

const PROVIDERS = require('../constants/providers')

async function tryWindow ({ root, ipfsConnectionTest }) {
  console.info('Trying window.ipfs')
  if (root.ipfs) {
    try {
      await ipfsConnectionTest(root.ipfs)
      console.info('Found `window.ipfs`. Nice!')
      return { ipfs: root.ipfs, provider: PROVIDERS.window }
    } catch (error) {
      console.warn('Failed to connect via window.ipfs', error)
    }
  } else {
    console.info('window.ipfs not found. Consider Installing the IPFS Companion web extension - https://github.com/ipfs-shipyard/ipfs-companion')
  }
}

module.exports = tryWindow
