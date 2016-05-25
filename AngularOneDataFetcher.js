import _snakeCase from 'lodash.snakecase'; // Used to help build dynamic cache keys.
import _isEmpty from 'lodash.isempty';
import _forEach from 'lodash.foreach';

/**
 * A helper for the caching service (CacheService).
 *
 * Handles getting from cache and fetching from origin and saving to cache if not already in cache.
 *
 * @todo
 * - Remove Angular dependency.
 */
export default class AngularOneDataFetcher {
    /**
     * @param {Function} fetchingStrategy The algorithm used to fetch the data. Should return a promise with .then(success, error).
     * @param {Object} $q Angular's promise object.
     * @param {String} key The key used to store in and retrieve from cache. Only provide if you want this data cached.
     * @param {Object} CacheService Look at app/modules/common/services/CacheService. Only provide if you want this data cached.
     * @param {Object} $ionicLoading Pass this in if you want a loader displayed while fetching data.
     */
    constructor(fetchingStrategy, $q, key = null, CacheService = null, $ionicLoading = null) {
        this._fetchingStrategy = fetchingStrategy;
        this._$q = $q;
        this._key = key;
        this._cacheService = CacheService;
        this._$ionicLoading = $ionicLoading;

        this._cacheDuration = null; // use the caching service's default by default.
    }

    /**
     * Call this if this data set needs a different duration than the default. Default in days is stored in app/config-values.
     *
     * @param {Number} hours
     */
    cacheDuration(hours) {
        this._cacheDuration = parseInt(hours, 10);
    }

    /**
     * Set this set of data to never expire.
     */
    neverExpire() {
        this._cacheDuration = false;
    }

    /**
     * Refresh data from data source to cache.
     * Main reason to use this is if you know the origin data has changed.
     *
     * @param params Additional params to pass to fetching strategy.
     *
     * @returns {Promise} (data) With data from origin.
     */
    refresh(...params) {
        return this._fetchFromOrigin(...params)
            .then((data) => {
                this._saveToCache(data, ...params);
                return data;
            });
    }

    /**
     * Get data from the cache if it's already stored there. If not, it will be retrieved
     * from its source and then cached before being returned.
     *
     * @param params Additional params to pass to fetching strategy. See: https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters
     *
     * @returns {Promise} Data from either the cache or the origin.
     */
    get(...params) {
        return this._$q((resolve, reject) => {
            var data = this._getFromCache(...params);

            if (data && !_isEmpty(data)) {
                resolve(data);
            }
            else {
                // Not in cache, let's fetch them.
                this._fetchFromOrigin(...params)
                    .then((data) => {
                        this._saveToCache(data, ...params);
                        resolve(data);
                    }, (result) => {
                        reject(result);
                    });
            }
        });
    }

    /**
     * Build the key to use for caching by appending any parameters being used to the provided key.
     *
     * @param params
     *
     * @returns {String} The key
     *
     * @private
     */
    _buildKey(...params) {
        var result = this._key;

        _forEach(params, (param) => {
            result += '_' + _snakeCase(param);
        });

        return result;
    }

    /**
     * Persist the given data.
     *
     * @param {*} data
     * @param params
     *
     * @private
     */
    _saveToCache(data, ...params) {
        if (!this._cacheService) {
            return false;
        }

        var key = this._buildKey(...params);

        if (this._cacheDuration === false) {
            // Data never expires (neverExpire()).
            this._cacheService.forever(key, data);
        }
        else if (this._cacheDuration === null) {
            // Use default expiration time.
            this._cacheService.set(key, data);
        } else {
            // Use custom expiration time (cacheDuration()).
            this._cacheService.set(key, data, this._cacheDuration);
        }
    }

    /**
     * Get data with the given/built key from the cache.
     *
     * @param params
     *
     * @returns {*}
     *
     * @private
     */
    _getFromCache(...params) {
        if (!this._cacheService) {
            return false;
        }

        var key = this._buildKey(...params);

        return this._cacheService.get(key);
    }

    /**
     * Fetches data from the data source using the provided fetching strategy.
     *
     * Also shows a loading message if a the loading manager was given.
     *
     * @param params Additional parameters to pass to fetching strategy.
     *
     * @returns {Promise}
     *
     * @private
     */
    _fetchFromOrigin(...params) {
        this._$ionicLoading && this._$ionicLoading.show({
            noBackdrop: true
        });

        return this._$q((resolve, reject) => {
            this._fetchingStrategy(...params)
                .then((data) => {
                    this._$ionicLoading && this._$ionicLoading.hide();
                    resolve(data);
                }, (result) => {
                    this._$ionicLoading && this._$ionicLoading.hide();
                    alert('Error retrieving data. Please make sure you are connected to the Internet.');
                    reject(result);
                });
        });
    }
}
