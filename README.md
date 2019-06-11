# ipfs-provider

[![](https://img.shields.io/badge/made%20by-Protocol%20Labs-blue.svg?style=flat-square)](https://protocol.ai)
[![](https://img.shields.io/badge/project-IPFS-blue.svg?style=flat-square)](http://ipfs.io/)
[![Build Status](https://flat.badgen.net/travis/ipfs-shipyard/ipfs-provider)](https://travis-ci.com/ipfs-shipyard/ipfs-provider)
[![Dependency Status](https://david-dm.org/ipfs-shipyard/ipfs-provider.svg?style=flat-square)](https://david-dm.org/ipfs-shipyard/ipfs-provider)

> Connect to IPFS via an available provider.

This module tries to connect to IPFS via multiple providers, in order:

- `webext` looks for an instance in the [background page of a WebExtension](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/API/extension/getBackgroundPage) (not used on regular web).
- [`window.ipfs`](https://github.com/ipfs-shipyard/ipfs-companion/blob/master/docs/window.ipfs.md) proxy in the current page (provided by the [IPFS Companion](https://github.com/ipfs-shipyard/ipfs-companion) browser extension).
- [`js-ipfs-http-client`](https://github.com/ipfs/js-ipfs-http-client) with either a user provided `apiAddress`, the current origin, or the default address (`/ip4/127.0.0.1/tcp/5001`).
- [`js-ipfs`](https://github.com/ipfs/js-ipfs) spawns an in process instance of IPFS (**disabled by default:** see [Enable js-ipfs](#enable-js-ipfs) for more info).


This is a port of the [ipfs-redux-bundle](https://github.com/ipfs-shipyard/ipfs-redux-bundle).

## Install

```sh
> npm install ipfs-provider
```

## Usage

```js
import getIpfs from 'ipfs-provider'

const { ipfs, provider } = await getIpfs({
  // These are the defaults:
  tryWebExt: true,    // set false to bypass WebExtension verification
  tryWindow: true,    // set false to bypass window.ipfs verification
  tryApi: true,       // set false to bypass js-ipfs-http-client verification
  apiAddress: null    // set this to use an api in that address if tryApi is true
  tryJsIpfs: false,   // set true to attempt js-ipfs initialisation
  getJsIpfs: null,    // must be set to a js-ipfs instance if tryJsIpfs is true
  jsIpfsOpts: {}      // set the js-ipfs options you want if tryJsIpfs is true
})
```

- `ipfs` is the running IPFS instance.
- `provider` is a string representing the chosen provider, either: `WEBEXT`, `WINDOW_IPFS`, `IPFS_HTTP_API` or `JS_IPFS`.

### Enable js-ipfs

To enable `js-ipfs`, pass the following options:

```js
const { ipfs, provider } = await getIpfs({
  tryJsIpfs: true,
  getJsIpfs: () => import('ipfs'),
  jsIpfsOpts: { /* advanced config */ }
})
```

- `tryJsIpfs` should be set to `true`.
- `getJsIpfs` should be a function that returns a promise that resolves with a `JsIpfs` constructor. This works well with [dynamic `import()`](https://developers.google.com/web/updates/2017/11/dynamic-import), so you can lazily load js-ipfs when it is needed.
- `jsIpfsOpts` should be an object which specifies [advanced configurations](https://github.com/ipfs/js-ipfs#ipfs-constructor) to the node.

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
