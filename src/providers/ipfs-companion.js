'use strict'

const PROVIDERS = require('../constants/providers')

async function tryCompanion ({ root, ipfsConnectionTest }) {
  console.info('Trying IPFS Companion')
  // Opportunistic optimizations when running from ipfs-companion (+ ipfs-desktop in future)
  if (typeof root.chrome === 'object' && root.chrome.extension && root.chrome.extension.getBackgroundPage) {
    // Note: under some vendors getBackgroundPage() will return null if window is in incognito mode
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1329304
    let webExt = null
    try {
      webExt = root.chrome.extension.getBackgroundPage()
    } catch (err) {
      // no ipfs companion for you
      return null
    }
    // If extension is ipfs-companion exposing IPFS API, use it directly for best performance
    if (webExt && webExt.ipfsCompanion && webExt.ipfsCompanion.ipfs) {
      const ipfs = webExt.ipfsCompanion.ipfs
      try {
        await ipfsConnectionTest(ipfs)
        return { ipfs, provider: PROVIDERS.companion }
      } catch (error) {
        console.warn('IPFS Companion detected but connection failed. Ignoring.', error)
      }
    }
  }
}

module.exports = tryCompanion
