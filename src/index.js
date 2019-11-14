'use strict'

const root = require('window-or-global')
const multiaddr = require('multiaddr')

const tryWebExt = require('./providers/webext')
const tryWindow = require('./providers/window-ipfs')
const tryApi = require('./providers/ipfs-http-api')
const tryJsIpfs = require('./providers/js-ipfs')

async function getIpfs (opts) {
  const defaultOpts = {
    tryWebExt: true,
    tryWindow: true,
    permissions: {},
    tryApi: true,
    apiIpfsOpts: {
      defaultApiAddress: '/ip4/127.0.0.1/tcp/5001',
      apiAddress: null,
      IpfsApi: null
    },
    tryJsIpfs: false,
    jsIpfsOpts: {},
    ipfsConnectionTest: (ipfs) => {
      // ipfs connection is working if can we fetch the empty directtory.
      return ipfs.get('QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn')
    }
  }

  if (opts && opts.apiIpfsOpts && opts.apiIpfsOpts.apiAddress) {
    opts.apiIpfsOpts.apiAddress = validateProvidedApiAddress(opts.apiIpfsOpts.apiAddress)
  }

  opts = Object.assign({}, defaultOpts, opts)
  opts.permissions = Object.assign({}, defaultOpts.permissions, opts.permissions)
  opts.apiIpfsOpts = Object.assign({}, defaultOpts.apiIpfsOpts, opts.apiIpfsOpts)
  opts.jsIpfsOpts = Object.assign({}, defaultOpts.jsIpfsOpts, opts.jsIpfsOpts)

  const { ipfsConnectionTest } = opts

  if (opts.tryWebExt) {
    const res = await tryWebExt({ root, ipfsConnectionTest })
    if (res) return res
  }

  if (opts.tryWindow) {
    const { permissions } = opts
    const res = await tryWindow({ root, permissions, ipfsConnectionTest })
    if (res) return res
  }

  if (opts.tryApi) {
    const { apiIpfsOpts } = opts
    const { location } = root
    const apiAddress = apiIpfsOpts.apiAddress
    const defaultApiAddress = apiIpfsOpts.defaultApiAddress
    const IpfsApi = apiIpfsOpts.IpfsApi
    const res = await tryApi({ apiAddress, defaultApiAddress, location, IpfsApi, ipfsConnectionTest })
    if (res) return res
  }

  if (opts.tryJsIpfs) {
    const { getJsIpfs, jsIpfsOpts } = opts
    const res = await tryJsIpfs({ jsIpfsOpts, getJsIpfs, ipfsConnectionTest })
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

module.exports = getIpfs
