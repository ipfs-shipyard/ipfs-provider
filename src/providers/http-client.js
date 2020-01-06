'use strict'

const PROVIDERS = require('../constants/providers')

// 1. Try user specified API address
// 2. Try current origin
// 3. Try multiaddr from defaultApiAddress
async function tryHttpClient ({ httpClient, apiAddress, defaultApiAddress, location, connectionTest }) {
  // Explicit custom apiAddress provided. Only try that.
  if (apiAddress) {
    return maybeApi({ apiAddress, connectionTest, httpClient })
  }

  // Current origin is not localhost:5001 so try with current origin info
  if (location && !(location.port === '5001' && location.hostname.match(/^127.0.0.1$|^localhost$/))) {
    const origin = new URL(location.origin)
    origin.pathname = '/'
    const res = await maybeApi({
      apiAddress: origin.toString(),
      connectionTest,
      httpClient
    })
    if (res) return res
  }

  // ...otherwise try /ip4/127.0.0.1/tcp/5001
  return maybeApi({ apiAddress: defaultApiAddress, connectionTest, httpClient })
}

// Helper to construct and test an api client. Returns an js-ipfs-api instance or null
async function maybeApi ({ apiAddress, connectionTest, httpClient }) {
  try {
    const ipfs = httpClient(apiAddress)
    await connectionTest(ipfs)
    return { ipfs, provider: PROVIDERS.httpClient, apiAddress }
  } catch (error) {
    // Failed to connect to ipfs-api in `apiAddress`
  }
}

module.exports = tryHttpClient
