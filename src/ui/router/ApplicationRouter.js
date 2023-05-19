/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
/*global module*/

const LocationBar = require('location-bar');
const EventEmitter = require('EventEmitter');
const _ = require('lodash');

class ApplicationRouter extends EventEmitter {
  /**
     * events
     * change:params -> notify listeners w/ new, old, and changed.
     * change:path -> notify listeners w/ new, old paths.
     *
     * methods:
     * update(path, params) -> updates path and params at the same time.  Only
     *   updates specified params, other params are not modified.
     * updateParams(newParams) -> update only specified params, leaving rest
     *      intact.  Does not modify path.
     * updatePath(path);

     * route(path, handler);
     * start(); Start routing.
     */
  constructor(openmct) {
    super();

    this.locationBar = new LocationBar();
    this.openmct = openmct;
    this.routes = [];
    this.started = false;

    this.setHash = _.debounce(this.setHash.bind(this), 300);

    openmct.once('destroy', () => {
      this.destroy();
    });
  }

  // Public Methods

  destroy() {
    this.locationBar.stop();
  }

  /**
   * Delete a given query parameter from current url
   *
   * @param {string} paramName name of searchParam to delete from current url searchParams
   */
  deleteSearchParam(paramName) {
    let url = this.getHashRelativeURL();

    url.searchParams.delete(paramName);
    this.setLocationFromUrl();
  }

  /**
   * object for accessing all current search parameters
   *
   * @returns {URLSearchParams} A {@link https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/entries|URLSearchParams}
   */
  getAllSearchParams() {
    return this.getHashRelativeURL().searchParams;
  }

  /**
   * Uniquely identifies a domain object.
   *
   * @typedef CurrentLocation
   * @property {URL} url current url location
   * @property {string} path current url location pathname
   * @property {string} getQueryString a function which returns url search query
   * @property {object} params object representing url searchParams
   */

  /**
   * object for accessing current url location and search params
   *
   * @returns {CurrentLocation} A {@link CurrentLocation}
   */
  getCurrentLocation() {
    return this.currentLocation;
  }

  /**
   * Get current location URL Object
   *
   * @returns {URL} current url location
   */
  getHashRelativeURL() {
    return this.getCurrentLocation().url;
  }

  /**
   * Get current location URL Object searchParams
   *
   * @returns {object} object representing current url searchParams
   */
  getParams() {
    return this.currentLocation.params;
  }

  /**
   * Get a value of given param from current url searchParams
   *
   * @returns {string} value of paramName from current url searchParams
   */
  getSearchParam(paramName) {
    return this.getAllSearchParams().get(paramName);
  }

  /**
   * Navigate to given hash, update current location object, and notify listeners about location change
   *
   * @param {string} hash The URL hash to navigate to in the form of "#/browse/mine/{keyString}/{keyString}".
   * Should not include any params.
   */
  navigate(hash) {
    this.handleLocationChange(hash.substring(1));
  }

  /**
   * Check if a given object and current location object are same
   *
   * @param {Array<Object>} objectPath Object path of a given Domain Object
   *
   * @returns {Boolean}
   */
  isNavigatedObject(objectPath) {
    let targetObject = objectPath[0];
    let navigatedObject = this.path[0];

    if (!targetObject.identifier) {
      return false;
    }

    return this.openmct.objects.areIdsEqual(targetObject.identifier, navigatedObject.identifier);
  }

  /**
   * Add routes listeners
   *
   * @param {string} matcher Regex to match value in url
   * @param {@function} callback function called when found match in url
   */
  route(matcher, callback) {
    this.routes.push({
      matcher,
      callback
    });
  }

  /**
   * Set url hash using path and queryString
   *
   * @param {string} path path for url
   * @param {string} queryString queryString for url
   */
  set(path, queryString) {
    this.setHash(`${path}?${queryString}`);
  }

  /**
   * Will replace all current search parameters with the ones defined in urlSearchParams
   */
  setAllSearchParams() {
    this.setLocationFromUrl();
  }

  /**
   * To force update url based on value in currentLocation object
   */
  setLocationFromUrl() {
    this.updateTimeSettings();
  }

  /**
   * Set url hash using path
   *
   * @param {string} path path for url
   */
  setPath(path) {
    this.handleLocationChange(path.substring(1));
  }

  /**
   * Update param value from current url searchParams
   *
   * @param {string} paramName param name from current url searchParams
   * @param {string} paramValue param value from current url searchParams
   */
  setSearchParam(paramName, paramValue) {
    let url = this.getHashRelativeURL();

    url.searchParams.set(paramName, paramValue);
    this.setLocationFromUrl();
  }

  /**
   * start application routing, should be done after handlers are registered.
   */
  start() {
    if (this.started) {
      throw new Error('Router already started!');
    }

    this.started = true;

    this.locationBar.onChange((p) => this.hashChanged(p));
    this.locationBar.start({
      root: location.pathname
    });
  }

  /**
   * Set url hash using path and searchParams object
   *
   * @param {string} path path for url
   * @param {string} params oject representing searchParams key/value
   */
  update(path, params) {
    let searchParams = this.currentLocation.url.searchParams;
    for (let [key, value] of Object.entries(params)) {
      if (typeof value === 'undefined') {
        searchParams.delete(key);
      } else {
        searchParams.set(key, value);
      }
    }

    this.set(path, searchParams.toString());
  }

  /**
   * Update route params. Takes an object of updates.  New parameters
   */
  updateParams(updateParams) {
    let searchParams = this.currentLocation.url.searchParams;
    Object.entries(updateParams).forEach(([key, value]) => {
      if (typeof value === 'undefined') {
        searchParams.delete(key);
      } else {
        searchParams.set(key, value);
      }
    });

    this.setQueryString(searchParams.toString());
  }

  /**
   * To force update url based on value in currentLocation object
   */
  updateTimeSettings() {
    const hash = `${this.currentLocation.path}?${this.currentLocation.getQueryString()}`;

    this.setHash(hash);
  }

  // Private Methods

  /**
   * @private
   * Create currentLocation object
   *
   * @param {string} pathString USVString representing relative URL.
   *
   * @returns {CurrentLocation} A {@link CurrentLocation}
   */
  createLocation(pathString) {
    if (pathString[0] !== '/') {
      pathString = '/' + pathString;
    }

    let url = new URL(pathString, `${location.protocol}//${location.host}${location.pathname}`);

    return {
      url: url,
      path: url.pathname,
      getQueryString: () => url.search.replace(/^\?/, ''),
      params: paramsToObject(url.searchParams)
    };
  }

  /**
   * @private
   * Compare new and old path and on change emit event 'change:path'
   *
   * @param {string} newPath new path of url
   * @param {string} oldPath old path of url
   */
  doPathChange(newPath, oldPath) {
    if (newPath === oldPath) {
      return;
    }

    let route = this.routes.filter((r) => r.matcher.test(newPath))[0];
    if (route) {
      route.callback(newPath, route.matcher.exec(newPath), this.currentLocation.params);
    }

    this.openmct.telemetry.abortAllRequests();

    this.emit('change:path', newPath, oldPath);
  }

  /**
   * @private
   * Compare new and old params and on change emit event 'change:params'
   *
   * @param {object} newParams new params of url
   * @param {object} oldParams old params of url
   */
  doParamsChange(newParams, oldParams) {
    if (_.isEqual(newParams, oldParams)) {
      return;
    }

    let changedParams = {};
    Object.entries(newParams).forEach(([key, value]) => {
      if (value !== oldParams[key]) {
        changedParams[key] = value;
      }
    });
    Object.keys(oldParams).forEach((key) => {
      if (!Object.prototype.hasOwnProperty.call(newParams, key)) {
        changedParams[key] = undefined;
      }
    });

    this.emit('change:params', newParams, oldParams, changedParams);
  }

  /**
   * @private
   * On location change, update currentLocation object and emit appropriate events
   *
   * @param {string} pathString USVString representing relative URL.
   */
  handleLocationChange(pathString) {
    let oldLocation = this.currentLocation;
    let newLocation = this.createLocation(pathString);

    this.currentLocation = newLocation;

    if (!oldLocation) {
      this.doPathChange(newLocation.path, null);
      this.doParamsChange(newLocation.params, {});

      return;
    }

    this.doPathChange(newLocation.path, oldLocation.path);

    this.doParamsChange(newLocation.params, oldLocation.params);
  }

  /**
   * @private
   * On hash changed, update currentLocation object and emit appropriate events
   *
   * @param {string} hash new hash for url
   */
  hashChanged(hash) {
    this.emit('change:hash', hash);
    this.handleLocationChange(hash);
  }

  /**
   * @private
   * Set new hash for url
   *
   * @param {string} hash new hash for url
   */
  setHash(hash) {
    location.hash = '#' + hash.replace(/#/g, '');
  }

  /**
   * @private
   * Set queryString part of current url
   *
   * @param {string} queryString queryString part of url
   */
  setQueryString(queryString) {
    this.handleLocationChange(`${this.currentLocation.path}?${queryString}`);
  }
}

/**
 * Convert searchParams into Object
 *
 * @param {URLSearchParams} searchParams queryString part of url
 *
 * @returns {Object}
 */
function paramsToObject(searchParams) {
  let params = {};
  for (let [key, value] of searchParams.entries()) {
    if (params[key]) {
      if (!Array.isArray(params[key])) {
        params[key] = [params[key]];
      }

      params[key].push(value);
    } else {
      params[key] = value;
    }
  }

  return params;
}

module.exports = ApplicationRouter;
