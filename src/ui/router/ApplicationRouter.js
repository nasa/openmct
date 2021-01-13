/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
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
    }

    // Public Methods

    destroy() {
        this.locationBar.stop();
    }

    deleteSearchParam(paramName) {
        let url = this.getHashRelativeURL();

        url.searchParams.delete(paramName);
        this.setLocationFromUrl();
    }

    /**
     * @returns {URLSearchParams} A {@link https://developer.mozilla.org/en-US/docs/Web/API/URLSearchParams/entries|URLSearchParams}
     * object for accessing all current search parameters
     */
    getAllSearchParams() {
        return this.getHashRelativeURL().searchParams;
    }

    getCurrentLocation() {
        return this.currentLocation;
    }

    getHashRelativeURL() {
        return this.getCurrentLocation().url;
    }

    getParams() {
        return this.currentLocation.params;
    }

    getSearchParam(paramName) {
        return this.getAllSearchParams().get(paramName);
    }

    navigate(hash) {
        this.handleLocationChange(hash.substring(1));
    }

    route(matcher, callback) {
        this.routes.push({
            matcher,
            callback
        });
    }

    set(path, queryString) {
        this.setHash(`${path}?${queryString}`);
    }

    /**
     * Will replace all current search parameters with the ones defined in urlSearchParams
     * @param {URLSearchParams} paramMap
     */
    setAllSearchParams() {
        this.setLocationFromUrl();
    }

    setLocationFromUrl() {
        this.updateTimeSettings();
    }

    setPath(path) {
        this.handleLocationChange(path.substring(1));
    }

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

        this.locationBar.onChange(p => this.hashChaged(p));
        this.locationBar.start({
            root: location.pathname
        });
    }

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

    updateTimeSettings() {
        const hash = `${this.currentLocation.path}?${this.currentLocation.getQueryString()}`;

        this.setHash(hash);
    }

    // Private Methods
    createLocation(pathString) {
        if (pathString[0] !== '/') {
            pathString = '/' + pathString;
        }

        let url = new URL(
            pathString,
            `${location.protocol}//${location.host}${location.pathname}`
        );

        return {
            url: url,
            path: url.pathname,
            getQueryString: () => url.search.replace(/^\?/, ''),
            params: paramsToObject(url.searchParams)
        };
    }

    doPathChange(newPath, oldPath, newLocation) {
        let route = this.routes.filter(r => r.matcher.test(newPath))[0];
        if (route) {
            route.callback(newPath, route.matcher.exec(newPath), this.currentLocation.params);
        }

        this.emit('change:path', newPath, oldPath);
    }

    doParamsChange(newParams, oldParams, newLocation) {
        let changedParams = {};
        Object.entries(newParams).forEach(([key, value]) => {
            if (value !== oldParams[key]) {
                changedParams[key] = value;
            }
        });
        Object.keys(oldParams).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(newParams, key)) {
                changedParams[key] = undefined;
            }
        });

        this.emit('change:params', newParams, oldParams, changedParams);
    }

    handleLocationChange(pathString) {
        let oldLocation = this.currentLocation;
        let newLocation = this.createLocation(pathString);

        this.currentLocation = newLocation;

        if (!oldLocation) {
            this.doPathChange(newLocation.path, null, newLocation);
            this.doParamsChange(newLocation.params, {}, newLocation);

            return;
        }

        if (oldLocation.path !== newLocation.path) {
            this.doPathChange(
                newLocation.path,
                oldLocation.path,
                this
            );
        }

        if (!_.isEqual(oldLocation.params, newLocation.params)) {
            this.doParamsChange(
                newLocation.params,
                oldLocation.params,
                newLocation
            );
        }
    }

    hashChaged(p) {
        this.emit('change:hash', p);
        this.handleLocationChange(p);
    }

    setHash(hash) {
        location.hash = '#' + hash.replace(/#/g, '');
    }

    setQueryString(queryString) {
        this.handleLocationChange(`${this.currentLocation.path}?${queryString}`);
    }
}

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
