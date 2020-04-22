'use strict'

const { Buffer } = require('buffer')
const { getIpfs, providers } = require('ipfs-provider')
const { httpClient, jsIpfs, windowIpfs } = providers

document.addEventListener('DOMContentLoaded', async () => {
  const { ipfs, provider, apiAddress } = await getIpfs({
    // HTTP client library can be defined globally to keep code minimal
    // when httpClient provider is used multiple times
    loadHttpClientModule: () => require('ipfs-http-client'),
    // try window.ipfs (if present),
    // then http apis (if up),
    // and finally fallback to spawning embedded js-ipfs
    providers: [
      windowIpfs({
        permissions: { commands: ['files.add', 'files.cat'] }
      }),
      httpClient({
        // try multiaddr of a local node
        apiAddress: '/ip4/127.0.0.1/tcp/5001'
      }),
      httpClient(), // try "/api/v0/" on the same Origin as the page
      httpClient({
        // try URL of a remote node
        apiAddress: 'http://dev.local:8080'
      }),
      jsIpfs({
        // js-ipfs package is used only once, here
        loadJsIpfsModule: () => require('ipfs'), // note require instead of
        options: { } // pass config: https://github.com/ipfs/js-ipfs/blob/master/packages/ipfs/docs/MODULE.md#ipfscreateoptions
      })
    ]
  })

  console.log('IPFS API is provided by: ' + provider)
  if (provider === 'httpClient') {
    console.log('HTTP API address: ' + apiAddress)
  }

  async function store () {
    const toStore = document.getElementById('source').value
    for await (const file of ipfs.add(toStore)) {
      if (file && file.cid) {
        console.log('successfully stored', file)
        await display(file.cid.toString())
      } else {
        console.error('unable to add', file)
      }
    }
  }

  async function display (cid) {
    const chunks = []
    for await (const chunk of ipfs.cat(cid)) {
      chunks.push(chunk)
    }
    const data = Buffer.concat(chunks).toString()
    document.getElementById('cid').innerText = cid
    document.getElementById('content').innerText = data
    document.getElementById('output').setAttribute('style', 'display: block')
  }

  document.getElementById('store').onclick = store
})
