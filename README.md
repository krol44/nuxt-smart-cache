# nuxt-smart-cache

[![NPM version](https://img.shields.io/npm/v/@krol44/nuxt-smart-cache)](https://www.npmjs.com/package/@krol44/nuxt-smart-cache)

## About

Nuxtjs 2 module - cache pages on ssr to the disk, anti-ddos

## Demo

https://langlija.com - if you press f5 many times, spa mode will be activated

## Setup

1. `npm i --save @krol44/nuxt-smart-cache`
2. `add to nuxt.config.js`


```javascript
modules: [
  ['@krol44/nuxt-smart-cache', {
    antiDdos: {
      // default true
      enable: true,
      // default - 20 request for 5 seconds and will be locked
      maxRequestsForTime: [20, 5],
      // default 600 seconds
      timeToLockingSsr: 600
    },
    cache: {
      // default true
      enable: true,
      // default - /tmp/nuxt_cache_pages
      pathTempFiles: '/tmp/langlija_cache_pages',
      // default - token
      nameCookieForDisable: 'token',
      // default - true
      rmAllAfterStart: false,
      // default - 3600 seconds
      ttlFile: 3600 * 24 * 10,
      // default - []
      ignorePages: [
        '/',
        /\/dictionary.*/
      ]
    }
  }]
]
```

## License

MIT
