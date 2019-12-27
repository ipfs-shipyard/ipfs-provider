'use strict'
/* global jest, describe, it, expect */

const tryWebExt = require('../src/providers/webext.js')
const tryWindow = require('../src/providers/window-ipfs.js')
const tryHttpClient = require('../src/providers/http-client.js')
const tryJsIpfs = require('../src/providers/js-ipfs.js')
const PROVIDERS = require('../src/constants/providers.js')
const { getIpfs, providers } = require('../src/index.js')

jest.mock('../src/providers/webext.js')
jest.mock('../src/providers/window-ipfs.js')
jest.mock('../src/providers/http-client.js')
jest.mock('../src/providers/js-ipfs.js')

describe('getIpfs via availabe providers', () => {
  it('should return nothing if all providers are disabled', async () => {
    const res = await getIpfs({
      providers: [
        providers.jsIpfs({
          getConstructor: () => { throw new Error('provider init failed') }
        })
      ]
    })
    expect(res).toBeFalsy()
  })

  it('should return nothing if none of providers works', async () => {
    const res = await getIpfs({
      providers: []
    })
    expect(res).toBeFalsy()
  })

  it('should try webext only', async () => {
    const mockResult = { ipfs: {}, provider: PROVIDERS.webExt }
    tryWebExt.mockResolvedValue(mockResult)
    tryWindow.mockResolvedValue({ ipfs: {}, provider: 'nope' })
    const { ipfs, provider } = await getIpfs({
      providers: [
        providers.webExt()
      ]
    })
    expect(ipfs).toBeTruthy()
    expect(provider).toBe(mockResult.provider)
  })

  it('should try window.ipfs after webext', async () => {
    const mockResult = { ipfs: {}, provider: PROVIDERS.windowIpfs }
    tryWebExt.mockResolvedValue(null)
    tryWindow.mockResolvedValue(mockResult)
    const { ipfs, provider } = await getIpfs()
    expect(ipfs).toBeTruthy()
    expect(provider).toBe(mockResult.provider)
  })

  it('should try ipfs-http-api after window.ipfs', async () => {
    const mockResult = { ipfs: {}, provider: PROVIDERS.httpClient }
    tryWebExt.mockResolvedValue(null)
    tryWindow.mockResolvedValue(null)
    tryHttpClient.mockResolvedValue(mockResult)
    const { ipfs, provider } = await getIpfs()
    expect(ipfs).toBeTruthy()
    expect(provider).toBe(mockResult.provider)
  })

  it('should try js-ipfs if enabled', async () => {
    const mockResult = { ipfs: {}, provider: PROVIDERS.jsIpfs }
    tryWebExt.mockResolvedValue(null)
    tryWindow.mockResolvedValue(null)
    tryHttpClient.mockResolvedValue(null)
    tryJsIpfs.mockResolvedValue(mockResult)
    const { ipfs, provider } = await getIpfs({
      providers: [
        providers.jsIpfs({
          getConstructor: jest.fn()
        })
      ]
    })
    expect(ipfs).toBeTruthy()
    expect(provider).toBe(mockResult.provider)
  })
  /* TODO: draft, need to improve this API
  it('should work with custom providers', async () => {
    const mockResult = { ipfs: {}, provider: 'customProvider' }
    const customProvider = makeProvider(async ({ connectionTest }) => {
      try {
        const ipfs = // create IPFS API instance and confirm it works
        return { ipfs, provider: 'customProvider' }
      } catch(_) {
        return null
      }
      return mockResult
    })
    const { ipfs, provider } = await getIpfs({
      providers: [
        customProvider()
      ]
    })
    expect(ipfs).toBeTruthy()
    expect(provider).toBe(mockResult.provider)
  })
  */
})
