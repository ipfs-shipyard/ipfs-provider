'use strict'

const toMultiaddr = require('uri-to-multiaddr')

const PROVIDERS = require('../constants/providers')

// 1. Try user specified API address
// 2. Try current origin
// 3. Try default origin
async function tryApi ({ IpfsApi, apiAddress, defaultApiAddress, location, ipfsConnectionTest }) {
  // Explicit custom apiAddress provided. Only try that.
  if (apiAddress) {
    console.info('Trying ipfs-api with custom api address', apiAddress)
    return maybeApi({ apiAddress, ipfsConnectionTest, IpfsApi })
  }

  // Current origin is not localhost:5001 so try with current origin info
  if (location.port !== '5001' || !location.hostname.match(/^127.0.0.1$|^localhost$/)) {
    let originAddress = null
    try {
      originAddress = toMultiaddr(location.origin).toString()
    } catch (err) {
      console.warn(`Failed to convert ${location.origin} to a multiaddr`)
    }
    if (originAddress) {
      console.info('Trying ipfs-api at current origin', originAddress)
      const res = await maybeApi({
        apiAddress: originAddress,
        ipfsConnectionTest,
        IpfsApi
      })
      if (res) return res
    }
  }

  // ...otherwise try /ip4/127.0.0.1/tcp/5001
  console.info('Trying ipfs-api', defaultApiAddress)
  return maybeApi({ apiAddress: defaultApiAddress, ipfsConnectionTest, IpfsApi })
}

// Helper to construct and test an api client. Returns an js-ipfs-api instance or null
async function maybeApi ({ apiAddress, ipfsConnectionTest, IpfsApi }) {
  try {
    const ipfs = new IpfsApi(apiAddress)
    await ipfsConnectionTest(ipfs)
    return { ipfs, provider: PROVIDERS.api, apiAddress }
  } catch (error) {
    console.warn('Failed to connect to ipfs-api', apiAddress)
  }
}

module.exports = tryApi
