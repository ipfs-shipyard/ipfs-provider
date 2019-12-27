'use strict'

const PROVIDERS = require('../constants/providers')

async function tryWindow ({ root, permissions, connectionTest }) {
  if (root.ipfs) {
    // files.get is required for testing if API works, ensure we request it
    if (!(permissions && permissions.commands && permissions.commands.includes('files.get'))) {
      permissions = permissions || {}
      permissions = JSON.parse(JSON.stringify(permissions)) // deep copy to work with freezed objects
      permissions.commands = permissions.commands || []
      permissions.commands.push('files.get')
    }
    // try window.ipfs.enable first: https://github.com/ipfs-shipyard/ipfs-companion/issues/589
    const ipfs = typeof root.ipfs.enable === 'function'
      ? await root.ipfs.enable(permissions)
      : root.ipfs
    await connectionTest(ipfs)
    return { ipfs, provider: PROVIDERS.windowIpfs }
  }
}

module.exports = tryWindow
