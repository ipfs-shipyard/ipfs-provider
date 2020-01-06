'use strict'

const PROVIDERS = require('../constants/providers')
const { DEFAULT_HTTP_API } = require('../constants/defaults')

/*
 * This provider lazy-loads https://github.com/ipfs/js-ipfs-http-client
 * so it is not included as a dependency if not used.
 *
 * HTTP Client init fallback:
 * 1. Use constructor returned by getConstructor function
 * 2. Fallback to window.IpfsHttpClient
 *
 * API URL fallback order:
 * 1. Try user specified API address
 * 2. Try current origin
 * 3. Try DEFAULT_HTTP_API
*/
async function tryHttpClient ({ getConstructor, apiAddress, root, connectionTest }) {
  // Find HTTP client
  let httpClient
  if (getConstructor) httpClient = await getConstructor()

  // Final fllback to window.IpfsHttpClient or error
  if (!httpClient) {
    if (root.IpfsHttpClient) {
      httpClient = root.IpfsHttpClient
    } else {
      throw new Error('ipfs-provider could not initialize js-ipfs-http-client: make sure its constructor is returned by getConstructor function or exposed at window.IpfsHttpClient')
    }
  }

  // Allow the use of `import` or `require` on `getConstructor` fn
  httpClient = httpClient.default || httpClient // TODO: create 'import' demo in examples/

  // Explicit custom apiAddress provided. Only try that.
  if (apiAddress) {
    return maybeApi({ apiAddress, connectionTest, httpClient })
  }

  // Current origin is not localhost:5001 so try with current origin info
  const { location } = root
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
  return maybeApi({ apiAddress: DEFAULT_HTTP_API, connectionTest, httpClient })
}

// Init and test an api client against provded API address.
// Returns js-ipfs-http-client instance or null
async function maybeApi ({ apiAddress, connectionTest, httpClient }) {
  try {
    const ipfs = httpClient(apiAddress)
    await connectionTest(ipfs)
    return { ipfs, provider: PROVIDERS.httpClient, apiAddress }
  } catch (error) {
    // Failed to connect to ipfs-api in `apiAddress`
    return null
  }
}

module.exports = tryHttpClient
