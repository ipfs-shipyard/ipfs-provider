# ipfs-provider

[![](https://img.shields.io/github/release/ipfs-shipyard/ipfs-provider.svg)](https://github.com/ipfs-shipyard/ipfs-provider/releases/latest)
[![](https://img.shields.io/badge/made%20by-Protocol%20Labs-blue.svg?style=flat-square)](https://protocol.ai)
[![](https://img.shields.io/badge/project-IPFS-blue.svg?style=flat-square)](http://ipfs.io/)
[![Build Status](https://flat.badgen.net/travis/ipfs-shipyard/ipfs-provider)](https://travis-ci.com/ipfs-shipyard/ipfs-provider)
[![Dependency Status](https://david-dm.org/ipfs-shipyard/ipfs-provider.svg?style=flat-square)](https://david-dm.org/ipfs-shipyard/ipfs-provider)

> Returns IPFS API object by trying multiple [providers](#providers) in a custom fallback order.
>
> This is a general-purpose replacement for [ipfs-redux-bundle](https://github.com/ipfs-shipyard/ipfs-redux-bundle).

- [Install](#install)
- [Usage](#usage)
- [Examples](#examples)
- [Providers](#providers)
  - [`httpClient`](#httpclient) (remote/local HTTP API)
  - [`jsIpfs`](#jsipfs) (embedded js-ipfs node)
<!-- TODO: improve this API  - [create our own!](#creating-a-provider) -->
- [Test](#test)


## Install

### via NPM

```console
$ npm install ipfs-provider
```

### via prebuilt browser bundles

```html
<!-- remember to include js-ipfs (core) and/or js-ipfs-http-client, if they are used -->
<script src="https://cdn.jsdelivr.net/npm/ipfs-core/dist/index.min.js"></script>
<script src="https://cdn.jsdelivr.net/npm/ipfs-http-client/dist/index.min.js"></script>

<!-- prebuilt and minified bundle -->
<script src="https://cdn.jsdelivr.net/npm/ipfs-provider/dist/index.min.js"></script>

<script>
  const { getIpfs, providers } = window.IpfsProvider
  const { ipfs, provider, apiAddress } = await getIpfs({
    loadHttpClientModule: () => window.IpfsHttpClient,
    loadJsIpfsModule: () => window.IpfsCore,
    providers: [ /* see Usage below */ ]
    })
</script>
```

**Note:** when using prebuilt bundles in production use explicit versions and SRI hashes.
Details [here](https://github.com/ipfs/js-ipfs/tree/master/packages/ipfs-http-client#in-a-web-browser).
<!-- TODO: add prebuild+versions+sri example to ./examples -->

## Usage

```js
const { getIpfs, providers } = require('ipfs-provider')
const { httpClient, jsIpfs } = providers

const { ipfs, provider, apiAddress } = await getIpfs({
  // when httpClient provider is used multiple times
  // define its constructor once, at the top level
  loadHttpClientModule: () => require('ipfs-http-client'),

  // note this is an array, providers are tried in order:
  providers: [

    // try various HTTP endpoints (best-effort),
    httpClient({
      // (1) try multiaddr of a local node
      apiAddress: '/ip4/127.0.0.1/tcp/5001'
    }),
    httpClient(), // (2) try "/api/v0/" on the same Origin as the page
    httpClient({
      // (3) try arbitrary API from URL string
      apiAddress: 'https://some.example.com:8080'
    }),
    httpClient({
      // (4) try API defined by a custom http client config
      apiAddress: {
        host: 'apis.example.com',
        port: '443',
        protocol: 'https',
        apiPath: 'custom/path/to/api/v0',
        headers: {
          authorization: 'Basic dXNlcjpwYXNz'
        }
      }
    }),
    // (5) final fallback to spawning embedded js-ipfs running in-page
    jsIpfs({
      // js-ipfs package is used only once, as a last resort
      loadJsIpfsModule: () => require('ipfs-core'),
      options: { } // pass config: https://github.com/ipfs/js-ipfs/blob/master/packages/ipfs/docs/MODULE.md#ipfscreateoptions
    })
  ]
})

for await (const file of ipfs.add("text")) {
  if (file && file.cid) {
    console.log(`successfully stored at ${file.cid}`)
  } else {
    console.error('unable to ipfs.add', file)
  }
}
```

- `ipfs` – returned instance of IPFS API (see [SPEC](https://github.com/ipfs/js-ipfs/blob/master/docs/core-api/README.md))
- `provider` – a string with a name of the first successful provider.
   - built-in names match constants from `providers`: `httpClient`, `jsIpfs`, `windowIpfs` and `webExt`.
- `apiAddress` – returned only when `httpClient` provider is used, provides information which HTTP endpoint succeded


## Examples

See [`examples/`](./examples) for sample code and demonstration of advanced fallback strategies.

## Providers

You can customize the order of the providers by passing a different array order to the `providers` array.


For example, if you want to try `httpClient` and then `jsIpfs`, you should run it like this:

```js
const { getIpfs, providers } = require('ipfs-provider')
const { httpClient, jsIpfs } = providers

const { ipfs, provider } = await getIpfs({
  providers: [
    httpClient(),
    jsIpfs()
  ]
})
```

#### Customizing connection test

```js
const { ipfs, provider } = await getIpfs({
  providers: [ /* array of providers to try in order */ ],
  connectionTest: () => { /* boolean function to test the connection to IPFS, default one tries to ipfs.get the CID of an empty directory */ },
})
```

### `httpClient`

Tries to connect to HTTP API via [`js-ipfs-http-client`](https://github.com/ipfs/js-ipfs/tree/master/packages/ipfs-http-client):

```js
const { ipfs, provider } = await getIpfs({
  providers: [
    httpClient({
      loadHttpClientModule: () => require('ipfs-http-client'),
      apiAddress: 'https://api.example.com:8080/'
    })
  ]
})
```

This provider will attempt to establish connection with (in order):
1. `apiAddress` (if provided)
2. `/api/` at the current Origin
3. the default local API (`/ip4/127.0.0.1/tcp/5001`)

It supports lazy-loading and small bundle sizes. The client library is initialized using constructor (in order):
1. one returned by `loadHttpClientModule` async function (if provided)
2. one exposed at `window.IpfsHttpClient` (if present)

Value passed in `apiAddress` can be:
- a multiaddr (string like `/ip4/127.0.0.1/tcp/5001` or an [object](https://github.com/multiformats/js-multiaddr/))
- a String with an URL (`https://api.example.com:8080/`)
- a configuration object supported by the [constructor](https://github.com/ipfs/js-ipfs/tree/master/packages/ipfs-http-client#importing-the-module-and-usage)
  (`{ host: '1.1.1.1', port: '80', apiPath: '/ipfs/api/v0' }`)


To try multiple endpoints, simply use this provider multiple times.
See [`examples/browser-browserify/src/index.js`](./examples/browser-browserify/src/index.js) for real world example.

### `jsIpfs`

Spawns embedded [`js-ipfs`](https://github.com/ipfs/js-ipfs/tree/master/packages/ipfs) (a full IPFS node in JavaScript)
in the context of the current page using customizable constructor:

```js
const { ipfs, provider } = await getIpfs({
  providers: [
    jsIpfs({
      loadJsIpfsModule: () => require('ipfs-core'),
      options: { /* advanced config */ }
    })
  ]
})
```

- `loadJsIpfsModule` should be a function that returns a promise that resolves to a js-ipfs constructor
   <!-- TODO confirm below is true, if it is, add example to examples/ and link to it
   This works well with [dynamic `import()`](https://developers.google.com/web/updates/2017/11/dynamic-import), so you can lazily load js-ipfs when it is needed.
   -->
- `options` should be an object which specifies [advanced configurations](https://github.com/ipfs/js-ipfs#ipfs-constructor) to the node.
- **TIP:** when used in a browser context, use `ipfs-core` for a smaller browser bundle

### `windowIpfs`

[`window.ipfs`](https://github.com/ipfs-shipyard/ipfs-companion/blob/master/docs/window.ipfs.md) was an experiment created by [ipfs-companion](https://github.com/ipfs/ipfs-companion) browser extension.
It supported passing an optional list of permissions to [display a single ACL prompt](https://github.com/ipfs-shipyard/ipfs-companion/blob/master/docs/window.ipfs.md#do-i-need-to-confirm-every-api-call) the first time it is used:

```js
const { ipfs, provider } = await getIpfs({
  providers: [
    windowIpfs({
      // example
      permissions: { commands: ['add','cat','id', 'version'] }
    })
  ]
})
```

### `webExt`

`webExt` looks for an instance in the [background page of a WebExtension](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/extension/getBackgroundPage)
(useful only in browser extensions, not regular pages, disabled by default)

```js
const { ipfs, provider } = await getIpfs({
  providers: [
    webExt()
  ]
})
```

<!-- TODO: improve this API

#### Creating a provider

If built-in providers do not solve your use case, create your own!

A provider is just a function that returns an async function that returns
`{ ipfs, provider }`, but we provide `makeProvider` which enables `connectionTest`:

```js
const { getIpfs, makeProvider } = require('ipfs-provider')

const customProvider = makeProvider(async ({ connectionTest }) => {
  try {
    const ipfs = // create IPFS API instance somehow
    await connectionTest(ipfs)
    return { ipfs, provider: 'customProvider' }
  } catch (_) {
    return null
  }
})

const { ipfs, provider } = await getIpfs({
  providers: [
    customProvider()
  ]
})
```

-->

## Test

```console
$ npm test
```

## Lint

Perform [`standard`](https://standardjs.com/) linting on the code:

```console
$ npm run lint
```

## Contribute

Feel free to dive in! [Open an issue](https://github.com/ipfs-shipyard/ipfs-provider/issues/new) or submit PRs.

To contribute to IPFS in general, see the [contributing guide](https://github.com/ipfs/community/blob/master/CONTRIBUTING.md).

[![](https://cdn.rawgit.com/jbenet/contribute-ipfs-gif/master/img/contribute.gif)](https://github.com/ipfs/community/blob/master/CONTRIBUTING.md)

## License

[MIT](LICENSE) © Protocol Labs
