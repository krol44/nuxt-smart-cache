'use strict'

const { existsSync, readFileSync, writeFile, mkdirSync, rmSync, statSync } = require('fs')
const mapIpClients = new Map()

export default function smartCache (config) {
  const nuxt = this.nuxt

  config.antiDdos = {
    ...{
      enable: true,
      maxRequestsForTime: [20, 5],
      timeToLockingSsr: 3600
    }, ...config.antiDdos
  }
  config.cache = {
    ...{
      enable: true,
      pathTempFiles: '/tmp/nuxt_cache_pages',
      nameCookieForDisable: 'token',
      rmAllAfterStart: true,
      ttlFile: 3600,
      ignorePages: []
    }, ...config.cache
  }

  if (config.cache.rmAllAfterStart) {
    if (existsSync(config.cache.pathTempFiles)) {
      rmSync(config.cache.pathTempFiles, { recursive: true })
    }
  }
  mkdirSync(config.cache.pathTempFiles, { recursive: true })

  if (!nuxt.renderer) {
    return
  }
  const renderer = nuxt.renderer
  const renderRoute = renderer.renderRoute.bind(renderer)
  renderer.renderRoute = function (route, context) {
    let clientIp = context.req.headers['cf-connecting-ip'] ?? (context.req.headers['x-real-ip'] ??
      (context.req.connection.remoteAddress || context.req.socket.remoteAddress))

    let arr = mapIpClients.get(clientIp)
    if (arr !== undefined && arr[0] === 'spa') {
      if (Date.now() - arr[1] >= config.antiDdos.timeToLockingSsr * 1000) {
        mapIpClients.set(clientIp, [])
      } else {
        context.spa = true
      }
      return renderRoute(route, context)
    } else {
      if (config.antiDdos.enable) {
        if (arr) {
          arr.push(Date.now())
        }

        mapIpClients.set(clientIp, arr ? arr : [Date.now()])

        if (arr && arr.length >= config.antiDdos.maxRequestsForTime[0]) {
          let res = arr.pop() - arr.shift()

          let arrSet = []
          if (Math.round(res / 1000) <= config.antiDdos.maxRequestsForTime[1]) {
            console.log(clientIp + ' - ' + config.antiDdos.maxRequestsForTime[0] + ' requests: '
              + Math.round(res / 1000) + ' sec - enable spa on 1 hour')
            arrSet = ['spa', Date.now()]
          }

          mapIpClients.set(clientIp, arrSet)
        }
      }

      if (!config.cache.enable) {
        return renderRoute(route, context)
      }

      if (config.cache.ignorePages.some(path => path instanceof RegExp ?
        path.test(context.req.url) : context.req.url === path)) {
        return renderRoute(route, context)
      }

      // disable cache if cookie has name token
      let cookie = context.req.headers.cookie
      if (cookie !== undefined && cookie.search(config.cache.nameCookieForDisable + '=') !== -1) {
        return renderRoute(route, context)
      }

      let pwdCacheFile = config.cache.pathTempFiles + '/' + cyrb53(context.req.url) + '.json'
      let existFile = existsSync(pwdCacheFile)

      if (existFile) {
        let birthdayFile = new Date(statSync(pwdCacheFile).birthtime).getTime()
        if (Date.now() - birthdayFile >= config.cache.ttlFile * 1000) {
          rmSync(pwdCacheFile)
          existFile = false
        }
      }

      if (!existFile) {
        return renderRoute(route, context)
          .then(function (result) {
            if (!result.error && !result.redirected) {
              if (result === false) return
              writeFile(pwdCacheFile, serialize(result), function (err) {
                if (err) return console.log(err)
              })
            }
            return result
          })
      } else {
        return deserialize(readFileSync(pwdCacheFile))
      }
    }
  }

  function serialize (result) {
    return JSON.stringify(result, (key, value) => {
      if (typeof value === 'object' && value instanceof Set) {
        return { _t: 'set', _v: [...value] }
      }

      if (typeof value === 'function') {
        return { _t: 'func', _v: value() }
      }

      return value
    })
  }

  function deserialize (jsoned) {
    return JSON.parse(jsoned, (key, value) => {
      if (value && value._v) {
        if (value._t === 'set') {
          return new Set(value._v)
        }

        if (value._t === 'func') {
          const result = value._v
          return () => result
        }
      }

      return value
    })
  }

  function cyrb53 (str, seed = 0) {
    let h1 = 0xdeadbeef ^ seed, h2 = 0x41c6ce57 ^ seed
    for (let i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i)
      h1 = Math.imul(h1 ^ ch, 2654435761)
      h2 = Math.imul(h2 ^ ch, 1597334677)
    }
    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^ Math.imul(h2 ^ (h2 >>> 13), 3266489909)
    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^ Math.imul(h1 ^ (h1 >>> 13), 3266489909)
    return 4294967296 * (2097151 & h2) + (h1 >>> 0)
  }
}

module.exports.meta = require('./package.json')
