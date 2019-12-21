'use strict'

const root = require('window-or-global')
const multiaddr = require('multiaddr')
const httpClient = require('ipfs-http-client')
const mergeOptions = require('merge-options')

const tryWebExt = require('./providers/webext')
const tryWindow = require('./providers/window-ipfs')
const tryHttpClient = require('./providers/http-client')
const tryJsIpfs = require('./providers/js-ipfs')

const defaultGlobalOpts = {
  connectionTest: (ipfs) => {
    // ipfs connection is working if can we fetch the empty directtory.
    return ipfs.get('QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn')
  }
}

const makeProvider = (fn, defaults = {}) => {
  return (options = {}) => {
    return (globalOpts) => {
      options = mergeOptions(defaultGlobalOpts, defaults, globalOpts, options)
      return fn(options)
    }
  }
}

const providers = {
  httpClient: makeProvider((options) => {
    const { location } = root

    if (options.apiAddress) {
      options.apiAddress = validateProvidedApiAddress(options.apiAddress)
    }

    if (options.defaultApiAddress) {
      options.defaultApiAddress = validateProvidedApiAddress(options.defaultApiAddress)
    }

    return tryHttpClient({ httpClient, location, ...options })
  }, {
    defaultApiAddress: '/ip4/127.0.0.1/tcp/5001',
    apiAddress: null
  }),
  windowIpfs: makeProvider(options => {
    return tryWindow({ root, ...options })
  }),
  jsIpfs: makeProvider(options => {
    return tryJsIpfs(options)
  }),
  webExt: makeProvider(options => {
    return tryWebExt({ root, ...options })
  })
}

const defaultProviders = [
  providers.windowIpfs(),
  providers.httpClient()
]

async function getIpfs ({ providers = defaultProviders, ...options } = {}) {
  for (const provider of providers) {
    const res = await provider(options)
    if (res) return res
  }
}

function validateProvidedApiAddress (address) {
  if (address && !isMultiaddress(address)) {
    // `address` is not a valid multiaddr
    return null
  }
  return address
}

function isMultiaddress (addr) {
  if (addr === null || addr === undefined || typeof addr === 'undefined') {
    return false
  }

  try {
    multiaddr(addr)
    return true
  } catch (_) {
    return false
  }
}

module.exports = {
  getIpfs,
  providers
}
