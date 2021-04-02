'use strict'

const { URL } = require('iso-url')
const PROVIDERS = require('../constants/providers')
const { DEFAULT_HTTP_API } = require('../constants/defaults')

/*
 * This provider lazy-loads https://github.com/ipfs/js-ipfs/tree/master/packages/ipfs-http-client
 * so it is not included as a dependency if not used.
 *
 * HTTP Client init fallback:
 * 1. Use constructor returned by loadHttpClientModule function
 * 2. Fallback to window.IpfsHttpClient
 *
 * API URL fallback order:
 * 1. Try user specified API address
 * 2. Try current origin
 * 3. Try DEFAULT_HTTP_API
*/
async function tryHttpClient ({ loadHttpClientModule, apiAddress, root, connectionTest, ...options }) {
  // Find HTTP client
  let httpClient
  if (loadHttpClientModule) httpClient = await loadHttpClientModule()

  // Final fallback to window.IpfsHttpClient or error
  if (!httpClient) {
    if (root.IpfsHttpClient) {
      httpClient = root.IpfsHttpClient
    } else {
      throw new Error('ipfs-provider could not initialize js-ipfs-http-client: make sure its constructor is returned by loadHttpClientModule function or exposed at window.IpfsHttpClient')
    }
  }

  // Allow the use of `import` or `require` on `loadHttpClientModule` fn
  httpClient = httpClient.default || httpClient // TODO: create 'import' demo in examples/

  // If explicit custom apiAddress provided, only try that.
  if (apiAddress || options.url || options.host) {
    return maybeApi({ apiAddress, connectionTest, httpClient, ...options })
  }

  // Current origin is not localhost:5001 so try with current origin info
  const { location } = root
  if (location && !(location.port === '5001' && location.hostname.match(/^127.0.0.1$|^localhost$/))) {
    const origin = new URL(location.origin)
    origin.pathname = '/'
    const res = await maybeApi({
      apiAddress: origin.toString(),
      connectionTest,
      httpClient,
      ...options
    })
    if (res) return res
  }

  // ...otherwise try /ip4/127.0.0.1/tcp/5001
  return maybeApi({ apiAddress: DEFAULT_HTTP_API, connectionTest, httpClient, ...options })
}

// Init and test an api client against provided API address.
// Returns js-ipfs-http-client instance or null
async function maybeApi ({ apiAddress, connectionTest, httpClient, ...options }) {
  try {
    const ipfs = httpClient({ ...options, ...clientOptions(apiAddress) })
    await connectionTest(ipfs)
    return { ipfs, provider: PROVIDERS.httpClient, apiAddress }
  } catch (error) {
    // Failed to connect to ipfs-api in `apiAddress`
    // console.error('[ipfs-provider:httpClient]', error)
    return null
  }
}

// Convert string with URL or Multiaddr to explicit configuration object
// https://www.npmjs.com/package/ipfs-http-client#usage
const clientOptions = (apiAddress) => {
  switch (typeof apiAddress) {
    case 'string':
      return { url: apiAddress }
    case 'object':
      return JSON.parse(JSON.stringify(apiAddress)) // ensure deep copy
    case 'undefined':
      return {}
    default:
      throw new Error('invalid apiAddress passed to httpClient')
  }
}

module.exports = tryHttpClient
