# ipfs-provider

[![](https://img.shields.io/badge/made%20by-Protocol%20Labs-blue.svg?style=flat-square)](https://protocol.ai)
[![](https://img.shields.io/badge/project-IPFS-blue.svg?style=flat-square)](http://ipfs.io/)
[![Build Status](https://flat.badgen.net/travis/ipfs-shipyard/ipfs-provider)](https://travis-ci.com/ipfs-shipyard/ipfs-provider)
[![Dependency Status](https://david-dm.org/ipfs-shipyard/ipfs-provider.svg?style=flat-square)](https://david-dm.org/ipfs-shipyard/ipfs-provider)

> Returns IPFS API by trying multiple [providers](#providers) in a custom fallback order.  
> It is a general-purpose replacement for [ipfs-redux-bundle](https://github.com/ipfs-shipyard/ipfs-redux-bundle).

- [Install](#install)
- [Usage](#usage)
- [Examples](#examples)
- [Providers](#providers)
  - [`httpClient`](#httpclient)
  - [`jsIpfs`](#jsipfs)
  - [`windowIpfs`](#windowipfs)
  - [`webExt`](#webext)
<!-- TODO: improve this API  - [create our own!](#creating-a-provider) -->
- [Test](#test)


## Install

```console
$ npm install ipfs-provider
```

## Usage

```js
const { getIpfs, providers } = require('ipfs-provider')
const { httpClient, jsIpfs, windowIpfs, webExt } = providers

const { ipfs, provider } = await getIpfs({
  providers: [ // these are the defaults (the order matters)
    windowIpfs(),
    httpClient()
    // disabled by default: jsIpfs(), webExt()
  ]
})
```

- `ipfs` – returned IPFS API instance
- `provider` – a string with a name of the first successful provider.  
   - built-in names match constants from `providers`: `httpClient`, `jsIpfs`, `windowIpfs` and `webExt`.


## Examples

See [`examples/`](./examples) for sample code and demonstration of advanced fallback strategies.

## Providers

You can customize the order of the providers by passing a different array order to the `providers` array.


For example, if you want to try `httpClient` and then `windowIpfs`, you should run it like this:

```js
const { getIpfs, providers } = require('ipfs-provider')
const { httpClient, windowIpfs } = providers

const { ipfs, provider } = await getIpfs({
  // These are the defaults:
  providers: [
    httpClient(),
    windowIpfs()
  ]
})
```

#### Global options

There are options that can be passed to each provider and global ones. However, you can always override the global ones by passing the same one for a provider. Here is the list of global options:

```js
const { ipfs, provider } = await getIpfs({
  providers: [ /* ... */ ],
  connectionTest: () => { /* function to test the connection to IPFS */ }
})
```

Please keep in mind that all of these have defaults and you **do not** need to specify them.

### `httpClient`

Tries to connect to HTTP API via [`js-ipfs-http-client`](https://github.com/ipfs/js-ipfs-http-client).
This provider will establish connection with `apiAddress`, the current origin, or the default local API address (`/ip4/127.0.0.1/tcp/5001`).

The client library is initialized using a constructor returned by `loadHttpClientModule` async function or one exposed at `window.IpfsHttpClient`.
Supports lazy-loading and small bundle sizes.

Value provided in `apiAddress` can be:
- a multiaddr (string like `/ip4/127.0.0.1/tcp/5001` or an [object](https://github.com/multiformats/js-multiaddr/))
- a String with an URL (`https://api.example.com:8080/`)
- a configuration object supported by [`js-ipfs-http-client`](https://github.com/ipfs/js-ipfs-http-client#importing-the-module-and-usage)
  (`{ host: '1.1.1.1', port: '80', apiPath: '/ipfs/api/v0' }`)

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

To try multiple endpoints, simply use this provider multiple times.  
See [`examples/browser-browserify/src/index.js`](./examples/browser-browserify/src/index.js) for real world example.

### `jsIpfs`

Spawns embedded [`js-ipfs`](https://github.com/ipfs/js-ipfs) (full node in JavaScript)
in the context of the current page using customizable constructor:

```js
const { ipfs, provider } = await getIpfs({
  providers: [
    jsIpfs({
      loadJsIpfsModule: () => require('ipfs'),
      options: { /* advanced config */ }
    })
  ]
})
```

- `loadJsIpfsModule` should be a function that returns a promise that resolves with a [js-ipfs](https://github.com/ipfs/js-ipfs) constructor.
   <!-- TODO confirm below is true, if it is, add example to examples/ and link to it
   This works well with [dynamic `import()`](https://developers.google.com/web/updates/2017/11/dynamic-import), so you can lazily load js-ipfs when it is needed.
   -->
- `options` should be an object which specifies [advanced configurations](https://github.com/ipfs/js-ipfs#ipfs-constructor) to the node.

### `windowIpfs`

[`window.ipfs`](https://github.com/ipfs-shipyard/ipfs-companion/blob/master/docs/window.ipfs.md) is created by [ipfs-companion](https://github.com/ipfs/ipfs-companion) browser extension.  
It supports passing an optional list of permissions to [display a single ACL prompt](https://github.com/ipfs-shipyard/ipfs-companion/blob/master/docs/window.ipfs.md#do-i-need-to-confirm-every-api-call) the first time it is used:

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
