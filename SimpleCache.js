/**
 * Caching with custom expriation.
 *
 * @todo
 *  - I believe setItem() and getItem() are the more proper approach to localStorage.
 */
export default class SimpleCache {
    /**
     * Constructor.
     */
    constructor (defaultCacheMinutes) {
		this.defaultCacheMinutes = defaultCacheMinutes
    }

    /**
     * Tells you if the given value from the cache is considered expired.
     *
     * @param dataFromCache
     *
     * @returns {boolean}
     */
    _isExpired (dataFromCache) {
        if (!dataFromCache) {
            return true
        }

        return (dataFromCache.hasOwnProperty('expires') && dataFromCache.expires <= Date.now())
    }

    /**
     * Apply an expiration date to the given value.
     *
     * @param valueToCache
     * @param cacheMinutes
     *
     * @returns {{expires: Number, value: *}}
     */
    _applyExpirationDate (valueToCache, cacheMinutes) {
        if (valueToCache && valueToCache.expires) {
            return valueToCache
        }

        return {
            // 60000 = 1000 microseconds * 60 seconds = 1 minute
            expires: Date.now() + 60000 * cacheMinutes,
            value: valueToCache
        }
    }

    /**
     * Get data from the local cache.
     *
     * @param key
     *
     * @returns {*}
     */
    get (key) {
        var data = JSON.parse(window.localStorage[key])

        if (!data || this._isExpired(data)) {
            data = null
        }

        return (data ? data.value : data)
    }

    /**
     * Tell this to remember a value for a given period of time.
     *
     * @param {String} key
     * @param {*} value
     * @param {Number} cacheMinutes
     */
    set (key, value, cacheMinutes = null) {
        if (cacheMinutes === null) {
            cacheMinutes = 24 * parseInt(this.defaultCacheMinutes, 10)
        }

        window.localStorage[key] = JSON.stringify(this._applyExpirationDate(value, cacheMinutes))
    }

    /**
     * Add a value that will never expire.
     *
     * @param {String} key
     * @param {*} value
     */
    forever (key, value) {
        window.localStorage[key] = JSON.stringify({value: value})
    }

    /**
     * Unset the value for the given key in the cache.
     *
     * @param {String} key
     */
    forget (key) {
        window.localStorage[key] = null
    }
}
