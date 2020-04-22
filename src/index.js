'use strict'

const root = require('./constants/root')
const mergeOptions = require('merge-options')
const tryWebExt = require('./providers/webext')
const tryWindow = require('./providers/window-ipfs')
const tryHttpClient = require('./providers/http-client')
const tryJsIpfs = require('./providers/js-ipfs')

const defaultGlobalOpts = {
  connectionTest: async (ipfs) => {
    // ipfs connection is working if we can fetch data via async iterator API
    const cid = 'QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn'
    for await (const file of ipfs.get(cid)) {
      return file.type === 'dir' && file.name === cid
    }
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
    return tryHttpClient({ root, ...options })
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
    } catch (err) {
      // provider failed unexpectedly, log error and move to the next one
      console.error('[ipfs-provider]', err)
    }
  }
}

module.exports = {
  getIpfs,
  providers,
  makeProvider
}
