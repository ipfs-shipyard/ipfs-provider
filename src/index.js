'use strict'

const root = require('window-or-global')
const multiaddr = require('multiaddr')

const tryWebExt = require('./providers/webext')
const tryWindow = require('./providers/window-ipfs')
const tryApi = require('./providers/ipfs-http-api')
const tryJsIpfs = require('./providers/js-ipfs')

async function loadLibrary (id, url) {
  return new Promise((resolve, reject) => {
    try {
      // Browser side
      if (root.document !== undefined) {
        if (root.document.getElementById(id) == null) {
          const script = root.document.createElement('script')
          script.type = 'text/javascript'
          script.id = id
          script.async = false
          script.defer = false
          script.src = url
          script.crossorigin = 'anonymous'
          root.document.head.appendChild(script)
          script.onload = () => {
            console.log('Library loaded: ' + url)
            resolve(true)
          }
        } else {
          resolve(true)
        }
      // TODO: server side
      } else {
        reject(new Error('Unable to load library: ' + url))
      }
    } catch (error) {
      reject(error)
    }
  })
}

async function getIpfs (opts) {
  const defaultOpts = {
    tryWebExt: true,
    tryWindow: true,
    tryApi: true,
    tryJsIpfs: false,
    defaultApiAddress: '/ip4/127.0.0.1/tcp/5001',
    apiAddress: null,
    jsIpfsOpts: {},
    ipfsConnectionTest: (ipfs) => {
      // ipfs connection is working if can we fetch the empty directtory.
      return ipfs.get('QmUNLLsPACCz1vLxQVkXqqLX5R1X345qqfHbsf67hvA3Nn')
    }
  }

  if (opts && opts.apiAddress) {
    opts.apiAddress = validateProvidedApiAddress(opts.apiAddress)
  }

  opts = Object.assign({}, defaultOpts, opts)

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
    const { apiAddress, defaultApiAddress } = opts
    const { location } = root
    var IpfsApi = root.IpfsApi
    if (IpfsApi === undefined && root.IpfsHttpClient === undefined) {
      // https://github.com/ipfs/js-ipfs-http-client
      await loadLibrary('IpfsHttpClientLibrary', 'https://unpkg.com/ipfs-http-client/dist/index.js')
      IpfsApi = root.IpfsHttpClient
    }
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
