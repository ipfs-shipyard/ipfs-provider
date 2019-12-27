'use strict'
/* global jest, describe, it, expect */

const httpClient = require('ipfs-http-client')

const tryWebExt = require('../src/providers/webext.js')
const tryWindow = require('../src/providers/window-ipfs.js')
const tryHttpClient = require('../src/providers/http-client.js')
const tryJsIpfs = require('../src/providers/js-ipfs.js')
const PROVIDERS = require('../src/constants/providers.js')

describe('provider: webext', () => {
  it('should connect to ipfs API exposed on extension background page ', async () => {
    // chrome.extension.getBackgroundPage().ipfs will be present
    // only if ipfs-provider code is executed on a page loaded from a path
    // that belongs to a browser extension (assumes WebExtension Manifest v2)
    const mockIpfs = {}
    const root = {
      chrome: {
        extension: {
          getBackgroundPage () {
            return {
              ipfs: mockIpfs
            }
          }
        }
      }
    }
    const connectionTest = (ipfs) => {
      expect(ipfs).toEqual(mockIpfs)
      Promise.resolve()
    }
    const { ipfs, provider } = await tryWebExt({ root, connectionTest })
    expect(ipfs).toEqual(mockIpfs)
    expect(provider).toEqual(PROVIDERS.webExt)
  })
})

describe('provider: window.ipfs', () => {
  it('should use window.ipfs v2 (no permissions)', async () => {
    const opts = {
      root: {
        ipfs: { enable: async (args) => 'ok' }
      },
      connectionTest: jest.fn().mockResolvedValueOnce(true)
    }
    const { ipfs, provider } = await tryWindow(opts)
    expect(ipfs).toEqual('ok')
    expect(provider).toEqual(PROVIDERS.windowIpfs)
    expect(opts.connectionTest.mock.calls.length).toBe(1)
  })

  it('should use window.ipfs v2 (with permissions)', async () => {
    const opts = {
      root: {
        ipfs: { enable: async (args) => args }
      },
      connectionTest: jest.fn().mockResolvedValueOnce(true),
      permissions: Object.freeze({ commands: ['add', 'cat'], bar: ['1', '2', '3'], buzz: false })
    }
    const { ipfs, provider } = await tryWindow(opts)
    expect(provider).toEqual(PROVIDERS.windowIpfs)
    // Note: in this test, the returned  'ipfs' is the effective 'opts' echoed back
    const effectiveOpts = ipfs
    // Caveat 2: windowIpfs provider adds implicit request for files.get
    const expectedPermissions = opts.permissions.commands.concat(['files.get'])
    expect(effectiveOpts.commands).toEqual(expect.arrayContaining(expectedPermissions))
    // pass everything else as-is
    expect(effectiveOpts.bar).toEqual(opts.permissions.bar)
    expect(effectiveOpts.buzz).toEqual(opts.permissions.buzz)
    expect(opts.connectionTest.mock.calls.length).toBe(1)
  })

  it('should fallback to window.ipfs v1', async () => {
    const opts = {
      root: {
        ipfs: {}
      },
      connectionTest: jest.fn().mockResolvedValueOnce(true)
    }
    const { ipfs, provider } = await tryWindow(opts)
    expect(ipfs).toEqual(opts.root.ipfs)
    expect(provider).toEqual(PROVIDERS.windowIpfs)
    expect(opts.connectionTest.mock.calls.length).toBe(1)
  })
})

describe('provider: ipfs-http-api', () => {
  it('should use the apiAddress (implicit http)', async () => {
    const opts = {
      apiAddress: '/ip4/1.1.1.1/tcp/1111',
      defaultApiAddress: '/ip4/127.0.0.1/tcp/5001',
      location: new URL('http://localhost:5001'),
      httpClient,
      connectionTest: jest.fn().mockResolvedValueOnce(true)
    }
    const { ipfs, provider, apiAddress } = await tryHttpClient(opts)
    expect(apiAddress).toEqual(opts.apiAddress)
    expect(provider).toEqual(PROVIDERS.httpClient)
    expect(opts.connectionTest.mock.calls.length).toBe(1)
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
      httpClient,
      connectionTest: jest.fn().mockResolvedValueOnce(true)
    }
    const { ipfs, provider, apiAddress } = await tryHttpClient(opts)
    expect(apiAddress).toEqual(opts.apiAddress)
    expect(provider).toEqual(PROVIDERS.httpClient)
    expect(opts.connectionTest.mock.calls.length).toBe(1)
    const config = ipfs.getEndpointConfig()
    expect(config.host).toEqual('1.1.1.1')
    expect(config.port).toEqual('1111')
    expect(config.protocol).toEqual('https')
  })

  it('should use the implicit http:// location where origin is on http', async () => {
    const opts = {
      defaultApiAddress: '/ip4/127.0.0.1/tcp/5001',
      location: new URL('http://dev.local:5001/subdir/some-page.html'),
      httpClient,
      connectionTest: jest.fn().mockResolvedValueOnce(true)
    }
    const { ipfs, provider, apiAddress } = await tryHttpClient(opts)
    expect(apiAddress).toEqual('http://dev.local:5001/')
    expect(provider).toEqual(PROVIDERS.httpClient)
    expect(opts.connectionTest.mock.calls.length).toBe(1)
    const config = ipfs.getEndpointConfig()
    expect(config.host).toEqual('dev.local')
    expect(config.port).toEqual('5001')
    expect(config.protocol).toEqual('http')
  })

  it('should use the implicit https:// location where origin is on https', async () => {
    const opts = {
      defaultApiAddress: '/ip4/127.0.0.1/tcp/5001',
      location: new URL('https://dev.local:5001/subdir/some-page.html'),
      httpClient,
      connectionTest: jest.fn().mockResolvedValueOnce(true)
    }
    const { ipfs, provider, apiAddress } = await tryHttpClient(opts)
    expect(apiAddress).toEqual('https://dev.local:5001/')
    expect(provider).toEqual(PROVIDERS.httpClient)
    expect(opts.connectionTest.mock.calls.length).toBe(1)
    const config = ipfs.getEndpointConfig()
    expect(config.host).toEqual('dev.local')
    expect(config.port).toEqual('5001')
    expect(config.protocol).toEqual('https')
  })

  it('should use the location where port not 5001', async () => {
    const opts = {
      defaultApiAddress: '/ip4/127.0.0.1/tcp/5001',
      location: new URL('http://localhost:9999/subdir/some-page.html'),
      httpClient: jest.fn(),
      connectionTest: jest.fn().mockResolvedValueOnce(true)
    }
    const { provider, apiAddress } = await tryHttpClient(opts)
    expect(apiAddress).toEqual('http://localhost:9999/')
    expect(provider).toEqual(PROVIDERS.httpClient)
    expect(opts.connectionTest.mock.calls.length).toBe(1)
    expect(opts.httpClient.mock.calls.length).toBe(1)
  })

  it('should use the defaultApiAddress if location fails', async () => {
    const opts = {
      defaultApiAddress: '/ip4/127.0.0.1/tcp/5001',
      location: new URL('http://astro.cat:5001'),
      httpClient,
      // location call fails, default ok
      connectionTest: jest.fn()
        .mockRejectedValueOnce(new Error('nope'))
        .mockResolvedValueOnce(true)
    }
    const { ipfs, provider, apiAddress } = await tryHttpClient(opts)
    expect(apiAddress).toEqual(opts.defaultApiAddress)
    expect(provider).toEqual(PROVIDERS.httpClient)
    expect(opts.connectionTest.mock.calls.length).toBe(2)
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
      connectionTest: jest.fn().mockResolvedValueOnce(true),
      getConstructor: jest.fn().mockResolvedValueOnce(true),
      options: {},
      init: jest.fn().mockResolvedValue(mockIpfs)
    }
    const { ipfs, provider } = await tryJsIpfs(opts)
    expect(ipfs).toEqual(mockIpfs)
    expect(provider).toEqual(PROVIDERS.jsIpfs)
    expect(opts.connectionTest.mock.calls.length).toBe(1)
    expect(opts.init.mock.calls.length).toBe(1)
  })
})
