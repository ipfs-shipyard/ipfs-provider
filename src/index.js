'use strict'

const root = require('window-or-global')
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
    try {
      const res = await provider(options)
      if (res) return res
    } catch (_) {
      // provider failed, move to the next one
    }
  }
}

module.exports = {
  getIpfs,
  providers,
  makeProvider
}
