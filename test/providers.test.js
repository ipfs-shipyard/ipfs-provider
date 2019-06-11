'use strict'
/* global jest, describe, it, expect */

const IpfsApi = require('ipfs-http-client')

const tryWebExt = require('../src/providers/webext.js')
const tryWindow = require('../src/providers/window-ipfs.js')
const tryApi = require('../src/providers/ipfs-http-api.js')
const tryJsIpfs = require('../src/providers/js-ipfs.js')
const PROVIDERS = require('../src/constants/providers.js')

describe('provider: webext', () => {
  it('should connect to webext', async () => {
    // chrome.extension.getBackgroundPage().ipfsCompanion.ipfs will be present
    // only if page was loaded from a path that belongs to our browser extension
    const mockIpfs = {}
    const root = {
      chrome: {
        extension: {
          getBackgroundPage () {
            return {
              ipfsCompanion: {
                ipfs: mockIpfs
              }
            }
          }
        }
      }
    }
    const ipfsConnectionTest = (ipfs) => {
      expect(ipfs).toEqual(mockIpfs)
      Promise.resolve()
    }
    const { ipfs, provider } = await tryWebExt({ root, ipfsConnectionTest })
    expect(ipfs).toEqual(mockIpfs)
    expect(provider).toEqual(PROVIDERS.webext)
  })
})

describe('provider: window.ipfs', () => {
  it('should connect to window.ipfs', async () => {
    const opts = {
      root: {
        ipfs: {}
      },
      ipfsConnectionTest: jest.fn().mockResolvedValueOnce(true)
    }
    const { ipfs, provider } = await tryWindow(opts)
    expect(ipfs).toEqual(opts.root.ipfs)
    expect(provider).toEqual(PROVIDERS.window)
    expect(opts.ipfsConnectionTest.mock.calls.length).toBe(1)
  })
})

describe('provider: ipfs-http-api', () => {
  it('should use the apiAddress (implicit http)', async () => {
    const opts = {
      apiAddress: '/ip4/1.1.1.1/tcp/1111',
      defaultApiAddress: '/ip4/127.0.0.1/tcp/5001',
      location: new URL('http://localhost:5001'),
      IpfsApi: IpfsApi,
      ipfsConnectionTest: jest.fn().mockResolvedValueOnce(true)
    }
    const { ipfs, provider, apiAddress } = await tryApi(opts)
    expect(apiAddress).toEqual(opts.apiAddress)
    expect(provider).toEqual(PROVIDERS.api)
    expect(opts.ipfsConnectionTest.mock.calls.length).toBe(1)
    const config = ipfs.getEndpointConfig()
    expect(config.host).toEqual('1.1.1.1')
    expect(config.port).toEqual('1111')
    expect(config.protocol).toEqual('http')
  })

  it('should use the apiAddress (explicit https)', async () => {
    const opts = {
      apiAddress: '/ip4/1.1.1.1/tcp/1111/https',
      defaultApiAddress: '/ip4/127.0.0.1/tcp/5001',
      location: new URL('http://localhost:5001'),
      IpfsApi: IpfsApi,
      ipfsConnectionTest: jest.fn().mockResolvedValueOnce(true)
    }
    const { ipfs, provider, apiAddress } = await tryApi(opts)
    expect(apiAddress).toEqual(opts.apiAddress)
    expect(provider).toEqual(PROVIDERS.api)
    expect(opts.ipfsConnectionTest.mock.calls.length).toBe(1)
    const config = ipfs.getEndpointConfig()
    expect(config.host).toEqual('1.1.1.1')
    expect(config.port).toEqual('1111')
    expect(config.protocol).toEqual('https')
  })

  it('should use the http location where hostname not localhost', async () => {
    const opts = {
      defaultApiAddress: '/ip4/127.0.0.1/tcp/5001',
      location: new URL('http://dev.local:5001'),
      IpfsApi: IpfsApi,
      ipfsConnectionTest: jest.fn().mockResolvedValueOnce(true)
    }
    const { ipfs, provider, apiAddress } = await tryApi(opts)
    expect(apiAddress).toEqual('/dns4/dev.local/tcp/5001/http')
    expect(provider).toEqual(PROVIDERS.api)
    expect(opts.ipfsConnectionTest.mock.calls.length).toBe(1)
    const config = ipfs.getEndpointConfig()
    expect(config.host).toEqual('dev.local')
    expect(config.port).toEqual('5001')
    expect(config.protocol).toEqual('http')
  })

  it('should use the https location where hostname not localhost', async () => {
    const opts = {
      defaultApiAddress: '/ip4/127.0.0.1/tcp/5001',
      location: new URL('https://dev.local:5001'),
      IpfsApi: IpfsApi,
      ipfsConnectionTest: jest.fn().mockResolvedValueOnce(true)
    }
    const { ipfs, provider, apiAddress } = await tryApi(opts)
    expect(apiAddress).toEqual('/dns4/dev.local/tcp/5001/https')
    expect(provider).toEqual(PROVIDERS.api)
    expect(opts.ipfsConnectionTest.mock.calls.length).toBe(1)
    const config = ipfs.getEndpointConfig()
    expect(config.host).toEqual('dev.local')
    expect(config.port).toEqual('5001')
    expect(config.protocol).toEqual('https')
  })

  it('should use the location where port not 5001', async () => {
    const opts = {
      defaultApiAddress: '/ip4/127.0.0.1/tcp/5001',
      location: new URL('http://localhost:9999'),
      IpfsApi: jest.fn(),
      ipfsConnectionTest: jest.fn().mockResolvedValueOnce(true)
    }
    const { provider, apiAddress } = await tryApi(opts)
    expect(apiAddress).toEqual('/dns4/localhost/tcp/9999/http')
    expect(provider).toEqual(PROVIDERS.api)
    expect(opts.ipfsConnectionTest.mock.calls.length).toBe(1)
    expect(opts.IpfsApi.mock.calls.length).toBe(1)
  })

  it('should use the defaultApiAddress if location fails', async () => {
    const opts = {
      defaultApiAddress: '/ip4/127.0.0.1/tcp/5001',
      location: new URL('http://astro.cat:5001'),
      IpfsApi: IpfsApi,
      // location call fails, default ok
      ipfsConnectionTest: jest.fn()
        .mockRejectedValueOnce(new Error('nope'))
        .mockResolvedValueOnce(true)
    }
    const { ipfs, provider, apiAddress } = await tryApi(opts)
    expect(apiAddress).toEqual(opts.defaultApiAddress)
    expect(provider).toEqual(PROVIDERS.api)
    expect(opts.ipfsConnectionTest.mock.calls.length).toBe(2)
    const config = ipfs.getEndpointConfig()
    expect(config.host).toEqual('127.0.0.1')
    expect(config.port).toEqual('5001')
    expect(config.protocol).toEqual('http')
  })
})

describe('provider: js-ipfs', () => {
  it('should connect to js-ipfs', async () => {
    const mockIpfs = {}
    const opts = {
      ipfsConnectionTest: jest.fn().mockResolvedValueOnce(true),
      getJsIpfs: jest.fn().mockResolvedValueOnce(true),
      jsIpfsOpts: {},
      initJsIpfs: jest.fn().mockResolvedValue(mockIpfs)
    }
    const { ipfs, provider } = await tryJsIpfs(opts)
    expect(ipfs).toEqual(mockIpfs)
    expect(provider).toEqual(PROVIDERS.jsipfs)
    expect(opts.ipfsConnectionTest.mock.calls.length).toBe(1)
    expect(opts.initJsIpfs.mock.calls.length).toBe(1)
  })
})
