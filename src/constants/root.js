'use strict'
/* global self */

// Establish the root object, `window` in the browser, `self` in Service Worker. or `global` on the server.
// Credit: https://github.com/megawac/underscore/commit/365311c9a440438531ca1c6bfd49e3c7c5f46079
module.exports = (typeof self === 'object' && self.self === self && self) ||
  (typeof global === 'object' && global.global === global && global) ||
  this
