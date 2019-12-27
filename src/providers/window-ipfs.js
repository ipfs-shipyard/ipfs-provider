'use strict'

const PROVIDERS = require('../constants/providers')

async function tryWindow ({ root, permissions, connectionTest }) {
  if (root.ipfs) {
    permissions = permissions || {}
    permissions.commands = permissions.commands || []
    // files.get is required for testing if API works
    if (!permissions.commands.includes('files.get')) permissions.commands.push('files.get')
    // try window.ipfs.enable first: https://github.com/ipfs-shipyard/ipfs-companion/issues/589
    const ipfs = typeof root.ipfs.enable === 'function'
      ? await root.ipfs.enable(permissions)
      : root.ipfs
    await connectionTest(ipfs)
    return { ipfs, provider: PROVIDERS.windowIpfs }
  }
}

module.exports = tryWindow
