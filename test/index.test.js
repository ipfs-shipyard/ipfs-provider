'use strict'
/* global jest, describe, it, expect */

const IpfsApi = require('ipfs-http-client')
const root = require('window-or-global')
const tryWebExt = require('../src/providers/webext.js')
const tryWindow = require('../src/providers/window-ipfs.js')
const tryApi = require('../src/providers/ipfs-http-api.js')
const tryJsIpfs = require('../src/providers/js-ipfs.js')
const PROVIDERS = require('../src/constants/providers.js')
const getIpfs = require('../src/index.js')

jest.mock('../src/providers/webext.js')
jest.mock('../src/providers/window-ipfs.js')
jest.mock('../src/providers/ipfs-http-api.js')
jest.mock('../src/providers/js-ipfs.js')

describe('getIpfs via availabe providers', () => {
  it('should try nothing and fail if all providers are disabled', async () => {
    const res = await getIpfs({
      tryWebExt: false,
      tryWindow: false,
      tryApi: false,
      tryJsIpfs: false
    })
    expect(res).toBeFalsy()
  })

  it('should try webext first', async () => {
    const mockResult = { ipfs: {}, provider: PROVIDERS.webext }
    tryWebExt.mockResolvedValue(mockResult)
    tryWindow.mockResolvedValue({ ipfs: {}, provider: 'nope' })
    const { ipfs, provider } = await getIpfs()
    expect(ipfs).toBeTruthy()
    expect(provider).toBe(mockResult.provider)
  })

  it('should try window.ipfs after webext', async () => {
    const mockResult = { ipfs: {}, provider: PROVIDERS.window }
    tryWebExt.mockResolvedValue(null)
    tryWindow.mockResolvedValue(mockResult)
    const { ipfs, provider } = await getIpfs()
    expect(ipfs).toBeTruthy()
    expect(provider).toBe(mockResult.provider)
  })

  it('should try ipfs-http-api after window.ipfs', async () => {
    const mockResult = { ipfs: {}, provider: PROVIDERS.api }
    tryWebExt.mockResolvedValue(null)
    tryWindow.mockResolvedValue(null)
    tryApi.mockResolvedValue(mockResult)
    root.IpfsApi = IpfsApi
    expect(root.IpfsApi).toBeDefined()
    const { ipfs, provider } = await getIpfs()
    expect(ipfs).toBeTruthy()
    expect(provider).toBe(mockResult.provider)
  })

  it('should try js-ipfs if enabled', async () => {
    const mockResult = { ipfs: {}, provider: PROVIDERS.jsipfs }
    tryWebExt.mockResolvedValue(null)
    tryWindow.mockResolvedValue(null)
    tryApi.mockResolvedValue(null)
    tryJsIpfs.mockResolvedValue(mockResult)
    const { ipfs, provider } = await getIpfs({
      tryJsIpfs: true,
      getJsIpfs: jest.fn()
    })
    expect(ipfs).toBeTruthy()
    expect(provider).toBe(mockResult.provider)
  })
})
