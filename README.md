# ipfs-provider

[![](https://img.shields.io/badge/made%20by-Protocol%20Labs-blue.svg?style=flat-square)](https://protocol.ai)
[![](https://img.shields.io/badge/project-IPFS-blue.svg?style=flat-square)](http://ipfs.io/)
[![Build Status](https://flat.badgen.net/travis/ipfs-shipyard/ipfs-provider)](https://travis-ci.com/ipfs-shipyard/ipfs-provider)
[![Dependency Status](https://david-dm.org/ipfs-shipyard/ipfs-provider.svg?style=flat-square)](https://david-dm.org/ipfs-shipyard/ipfs-provider)

> This module tries to connect to IPFS via multiple [providers](#providers).

This is a port of the [ipfs-redux-bundle](https://github.com/ipfs-shipyard/ipfs-redux-bundle).

## Install

```console
$ npm install ipfs-provider
```

## Usage

```js
const { getIpfs, providers } = require('ipfs-provider')
const { webExt, jsIpfs, windowIpfs, httpClient } = providers

const { ipfs, provider } = await getIpfs({
  // These are the defaults:
  providers: [
    windowIpfs(),
    httpClient()
  ]
})
```

- `ipfs` is the running IPFS instance.
- `provider` is a string representing the chosen provider, either: `WEBEXT`, `WINDOW_IPFS`, `IPFS_HTTP_API` or `JS_IPFS`.

### Providers

You can customize the order of the providers by passing a different array order to the `providers` array. For example, if you want to try `httpClient` and then `windowIpfs`, you should run it like this:

```js
const { getIpfs, providers } = require('ipfs-provider')
const { webExt, jsIpfs, windowIpfs, httpClient } = providers

const { ipfs, provider } = await getIpfs({
  // These are the defaults:
  providers: [
    httpClient(),
    windowIpfs()
  ]
})
```

#### Global options

There are options that can be passed to each provider and global ones. However, you can always override the global ones by passing the same one for the provider. Here is the list of global options:

```js
const { ipfs, provider } = await getIpfs({
  providers: [ /* ... */ ],
  connectionTest: () => { /* function to test the connection to IPFS */ }
})
```

Please remind that all of these have defaults and you **do not** need to specify them.

#### `windowIpfs`

`window.ipfs` is a feature provided by [ipfs-companion](https://github.com/ipfs/ipfs-companion) browser extension. It supports passing an optional list of permissions to [display a single ACL prompt](https://github.com/ipfs-shipyard/ipfs-companion/blob/master/docs/window.ipfs.md#do-i-need-to-confirm-every-api-call) the first time it is used:

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

#### `httpClient`

[`js-ipfs-http-client`](https://github.com/ipfs/js-ipfs-http-client) with either a user provided `apiAddress`, the current origin, or the default address (`/ip4/127.0.0.1/tcp/5001`).

```js
const { ipfs, provider } = await getIpfs({
  providers: [
    httpClient({
      // defaults
      defaultApiAddress: '/ip4/127.0.0.1/tcp/5001',
      apiAddress: null
    })
  ]
})
```

#### `jsIpfs`

[`js-ipfs-http-client`](https://github.com/ipfs/js-ipfs-http-client) with either a user provided `apiAddress`, the current origin, or the default address (`/ip4/127.0.0.1/tcp/5001`).

```js
const { ipfs, provider } = await getIpfs({
  providers: [
    jsIpfs({
      // defaults
      getConstructor: () => import('ipfs'),
      options: { /* advanced config */ }
    })
  ]
})
```

- `getConstructor` should be a function that returns a promise that resolves with a `JsIpfs` constructor. This works well with [dynamic `import()`](https://developers.google.com/web/updates/2017/11/dynamic-import), so you can lazily load js-ipfs when it is needed.
- `options` should be an object which specifies [advanced configurations](https://github.com/ipfs/js-ipfs#ipfs-constructor) to the node.

#### `webExt`

`webExt` looks for an instance in the [background page of a WebExtension](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/extension/getBackgroundPage) (used only in browser extensions, not regular pages, **disabled by default**).

```js
const { ipfs, provider } = await getIpfs({
  providers: [
    webExt()
  ]
})
```

## Test

```sh
> npm test
```

## Lint

Perform [`standard`](https://standardjs.com/) linting on the code:

```sh
> npm run lint
```

## Contribute

Feel free to dive in! [Open an issue](https://github.com/ipfs-shipyard/ipfs-provider/issues/new) or submit PRs.

To contribute to IPFS in general, see the [contributing guide](https://github.com/ipfs/community/blob/master/CONTRIBUTING.md).

[![](https://cdn.rawgit.com/jbenet/contribute-ipfs-gif/master/img/contribute.gif)](https://github.com/ipfs/community/blob/master/CONTRIBUTING.md)

## License

[MIT](LICENSE) © Protocol Labs
