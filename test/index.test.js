'use strict'
/* global jest, describe, it, expect */

const tryCompanion = require('../src/providers/ipfs-companion.js')
const tryWindow = require('../src/providers/window-ipfs.js')
const tryApi = require('../src/providers/ipfs-http-api.js')
const tryJsIpfs = require('../src/providers/js-ipfs.js')
const PROVIDERS = require('../src/constants/providers.js')
const getIpfs = require('../src/index.js')

describe('provider: ipfs-companion', () => {
  it('should connect to ipfs-companion', async () => {
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
    const res = await tryCompanion({ root, ipfsConnectionTest })
    expect(res.ipfs).toEqual(mockIpfs)
    expect(res.provider).toEqual(PROVIDERS.companion)
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
    const res = await tryWindow(opts)
    expect(res.ipfs).toEqual(opts.root.ipfs)
    expect(res.provider).toEqual(PROVIDERS.window)
    expect(opts.ipfsConnectionTest.mock.calls.length).toBe(1)
  })
})

describe('provider: ipfs-http-api', () => {
  it('should use the apiAddress', async () => {
    const opts = {
      apiAddress: '/ip4/1.1.1.1/tcp/1111',
      defaultApiAddress: '/ip4/127.0.0.1/tcp/5001',
      location: new URL('http://localhost:5001'),
      IpfsApi: jest.fn(),
      ipfsConnectionTest: jest.fn().mockResolvedValueOnce(true)
    }
    const res = await tryApi(opts)
    expect(res.apiAddress).toEqual(opts.apiAddress)
    expect(res.provider).toEqual(PROVIDERS.api)
    expect(opts.ipfsConnectionTest.mock.calls.length).toBe(1)
    expect(opts.IpfsApi.mock.calls.length).toBe(1)
  })

  it('should use the location where hostname not localhost', async () => {
    const opts = {
      defaultApiAddress: '/ip4/127.0.0.1/tcp/5001',
      location: new URL('http://dev.local:5001'),
      IpfsApi: jest.fn(),
      ipfsConnectionTest: jest.fn().mockResolvedValueOnce(true)
    }
    const res = await tryApi(opts)
    expect(res.apiAddress).toEqual('/dns4/dev.local/tcp/5001/http')
    expect(res.provider).toEqual(PROVIDERS.api)
    expect(opts.ipfsConnectionTest.mock.calls.length).toBe(1)
    expect(opts.IpfsApi.mock.calls.length).toBe(1)
  })

  it('should use the location where port not 5001', async () => {
    const opts = {
      defaultApiAddress: '/ip4/127.0.0.1/tcp/5001',
      location: new URL('http://localhost:9999'),
      IpfsApi: jest.fn(),
      ipfsConnectionTest: jest.fn().mockResolvedValueOnce(true)
    }
    const res = await tryApi(opts)
    expect(res.apiAddress).toEqual('/dns4/localhost/tcp/9999/http')
    expect(res.provider).toEqual(PROVIDERS.api)
    expect(opts.ipfsConnectionTest.mock.calls.length).toBe(1)
    expect(opts.IpfsApi.mock.calls.length).toBe(1)
  })

  it('should use the defaultApiAddress if location fails', async () => {
    const opts = {
      defaultApiAddress: '/ip4/127.0.0.1/tcp/5001',
      location: new URL('http://astro.cat:5001'),
      IpfsApi: jest.fn(),
      // location call fails, default ok
      ipfsConnectionTest: jest.fn()
        .mockRejectedValueOnce(new Error('nope'))
        .mockResolvedValueOnce(true)
    }
    const res = await tryApi(opts)
    expect(res.apiAddress).toEqual(opts.defaultApiAddress)
    expect(res.provider).toEqual(PROVIDERS.api)
    expect(opts.ipfsConnectionTest.mock.calls.length).toBe(2)
    expect(opts.IpfsApi.mock.calls.length).toBe(2)
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
    const res = await tryJsIpfs(opts)
    expect(res.ipfs).toEqual(mockIpfs)
    expect(res.provider).toEqual(PROVIDERS.jsipfs)
    expect(opts.ipfsConnectionTest.mock.calls.length).toBe(1)
    expect(opts.initJsIpfs.mock.calls.length).toBe(1)
  })
})

describe('getIpfs via providers', () => {
  it('should try nothing and fail if all providers are disabled', async () => {
    const res = await getIpfs({
      tryCompanion: false,
      tryWindow: false,
      tryApi: false,
      tryJsIpfs: false
    })
    expect(res).toBe(undefined)
  })
})
