'use strict'

const PROVIDERS = require('../constants/providers')

async function tryWebExt ({ root, connectionTest }) {
  // Opportunistic optimizations when running inside of web extension (eg. ipfs-companion)
  if (typeof root.chrome === 'object' && root.chrome.extension && root.chrome.extension.getBackgroundPage) {
    // Note: under some vendors getBackgroundPage() will return null if window is in incognito mode
    // https://bugzilla.mozilla.org/show_bug.cgi?id=1329304
    let bg = null
    try {
      bg = root.chrome.extension.getBackgroundPage()
    } catch (err) {
      // not in browser extension
      return null
    }
    // If extension is exposing IPFS API as `ipfs` on the background page
    // it can be used directly for the best performance
    if (bg && bg.ipfs) {
      const { ipfs } = bg
      await connectionTest(ipfs)
      return { ipfs, provider: PROVIDERS.webext }
    }
    /*  Other endpoints can be added here in the future.
        For example, Companion could provide API for other browser extensions:
        https://github.com/ipfs-shipyard/ipfs-companion/issues/307 */
  }
}

module.exports = tryWebExt
