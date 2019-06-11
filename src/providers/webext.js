'use strict'

const PROVIDERS = require('../constants/providers')

async function tryWebExt ({ root, ipfsConnectionTest }) {
  // Opportunistic optimizations when running inside of web extension (eg. ipfs-companion)
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
    // If extension is ipfs-companion and it is exposing IPFS API,
    // use it directly for the best performance
    if (webExt && webExt.ipfsCompanion && webExt.ipfsCompanion.ipfs) {
      const ipfs = webExt.ipfsCompanion.ipfs
      await ipfsConnectionTest(ipfs)
      return { ipfs, provider: PROVIDERS.webext }
    }
    /*  Other endpoints can be added here in the future.
        For example, Companion could provide API for other browser extensions:
        https://github.com/ipfs-shipyard/ipfs-companion/issues/307 */
  }
}

module.exports = tryWebExt
