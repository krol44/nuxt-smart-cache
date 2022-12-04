# nuxt-smart-cache

[![NPM version](https://img.shields.io/npm/v/@krol44/nuxt-smart-cache)](https://www.npmjs.com/package/@krol44/nuxt-smart-cache)

## About

Nuxtjs module - cache pages on ssr, anti-ddos

## Demo

https://langlija.com - if you press f5 many times, spa mode will be activated

## Setup

add to nuxt.config.js

```javascript
modules: [
  ['@krol44/nuxt-smart-cache', {
    antiDdos: {
      enable: true, // default true
      maxRequestsForTime: [20, 5], // default - 20 request for 5 seconds and will be locked
      timeToLockingSsr: 600 // default 600 seconds
    },
    cache: {
      enable: true, // default true
      pathTempFiles: '/tmp/langlija_cache_pages', // default - /tmp/nuxt_cache_pages
      nameCookieForDisable: 'token', // default - token
      rmAllAfterStart: false, // default - true
      ttlFile: 3600 * 24 * 10, // default - 3600 seconds
      ignorePages: [
        '/',
        /\/dictionary.*/
      ] // default - []
    }
  }]
]
```

## License

MIT
