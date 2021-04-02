'use strict'

const { getIpfs, providers } = require('ipfs-provider')
const { httpClient, jsIpfs } = providers

document.addEventListener('DOMContentLoaded', async () => {
  console.log('IPFS starting..')
  const { ipfs, provider, apiAddress } = await getIpfs({
    // HTTP client library can be defined globally to keep code minimal
    // when httpClient provider is used multiple times
    loadHttpClientModule: () => require('ipfs-http-client'),
    // try window.ipfs (if present),
    // then http apis (if up),
    // and finally fallback to spawning embedded js-ipfs
    providers: [
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
        loadJsIpfsModule: () => require('ipfs-core'), // note require instead of
        options: {
          init: { alogorithm: 'ed25519' }
        }
      })
    ]
  })

  console.log('IPFS API is provided by: ' + provider)
  if (provider === 'httpClient') {
    console.log('HTTP API address: ' + apiAddress)
  }

  async function store () {
    const toStore = document.getElementById('source').value
    const result = await ipfs.add(toStore)
    if (result && result.cid) {
      console.log('successfully stored', result)
      await display(result.cid.toString())
    } else {
      console.error('unable to ipfs.add', result)
    }
  }

  async function display (cid) {
    const chunks = []
    for await (const chunk of ipfs.cat(cid)) {
      chunks.push(chunk)
    }

    // merge all chunks into single byte buffer (does not matter here, as text
    // entered by user will be short enough to fit in a single chunk, but makes
    // this example useful for bigger files)
    const data = new Uint8Array(chunks.reduce((acc, curr) => [...acc, ...curr], []))

    document.getElementById('cid').innerText = cid
    document.getElementById('content').innerText = new TextDecoder().decode(data)
    document.getElementById('output').setAttribute('style', 'display: block')
  }

  document.getElementById('store').onclick = store
})
