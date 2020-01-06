'use strict'

const { getIpfs, providers } = require('ipfs-provider')
const { httpClient, jsIpfs, windowIpfs } = providers

document.addEventListener('DOMContentLoaded', async () => {
  const { ipfs, provider } = await getIpfs({
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
        getConstructor: () => require('ipfs'), // note: 'require' can be used instead of 'import'
        options: { } // pass config: https://github.com/ipfs/js-ipfs#ipfs-constructor
      })
    ]
  })

  console.log('IPFS API is provided by: ' + provider)

  async function store () {
    const toStore = document.getElementById('source').value
    const result = await ipfs.add(toStore)
    for (const file of result) {
      if (file && file.hash) {
        console.log('successfully stored', file.hash)
        await display(file.hash)
      }
    }
  }

  async function display (hash) {
    const data = await ipfs.cat(hash)
    document.getElementById('hash').innerText = hash
    document.getElementById('content').innerText = data
    document.getElementById('output').setAttribute('style', 'display: block')
  }

  document.getElementById('store').onclick = store
})
