'use strict'

const root = require('window-or-global')
const multiaddr = require('multiaddr')
const IpfsApi = require('ipfs-http-client')

const tryCompanion = require('./providers/ipfs-companion')
const tryWindow = require('./providers/window-ipfs')
const tryApi = require('./providers/ipfs-http-api')
const tryJsIpfs = require('./providers/js-ipfs')

async function getIpfs (opts) {
  opts = Object.assign({}, {
    tryCompanion: true,
    tryWindow: true,
    tryApi: true,
    tryJsIpfs: false,
    defaultApiAddress: '/ip4/127.0.0.1/tcp/5001',
    apiAddress: getProvidedApiAddress(opts.apiAddress),
    jsIpfsOpts: {},
    ipfsConnectionTest: (ipfs) => {
      // ipfs connection is working if can we fetch the empty directtory.
      return ipfs.get('QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn')
    }
  }, opts)

  const { ipfsConnectionTest } = opts

  if (opts.tryCompanion) {
    return tryCompanion({ root, ipfsConnectionTest })
  }

  if (opts.tryWindow) {
    return tryWindow({ root, ipfsConnectionTest })
  }

  if (opts.tryApi) {
    const { apiAddress, defaultApiAddress } = opts
    const { location } = root
    return tryApi({ apiAddress, defaultApiAddress, location, IpfsApi, ipfsConnectionTest })
  }

  if (opts.tryJsIpfs) {
    const { getJsIpfs, jsIpfsOpts } = opts
    return tryJsIpfs({ jsIpfsOpts, getJsIpfs, ipfsConnectionTest })
  }
}

function getProvidedApiAddress (address) {
  if (address && !isMultiaddress(address)) {
    console.warn(`The ipfsApi address ${address} is invalid.`)
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

module.exports = getIpfs
