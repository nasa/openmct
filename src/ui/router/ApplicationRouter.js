/**

Application router -- must

*/
/*global _,module*/

// import _ from 'lodash';

const LocationBar = require('location-bar');
const EventEmitter = require('EventEmitter');

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
    constructor() {
        super()
        this.routes = [];
        this.started = false;
    }

    /**
     * start application routing, should be done after handlers are registered.
     */
    start() {
        if (this.started) {
            throw new Error('Router already started!');
        }
        this.started = true;
        let locationBar = new LocationBar();
        locationBar.onChange(p => this.handleLocationChange(p));
        locationBar.start({
            root: location.pathname
        });
    }

    handleLocationChange(pathString) {
        if (pathString[0] !== '/') {
            pathString = '/' + pathString
        }

        let url = new URL(
            pathString,
            `${location.protocol}//${location.host}${location.pathname}`
        )

        let oldLocation = this.currentLocation;

        let newLocation = {
            url: url,
            path: url.pathname,
            queryString: url.search.replace(/^\?/, ''),
            params: paramsToObject(url.searchParams)
        };

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

    doPathChange(newPath, oldPath, newLocation) {
        let route = this.routes.filter(r => r.matcher.test(newPath))[0];
        if (route) {
            route.callback(newPath, route.matcher.exec(newPath), this.currentLocation.params);
        }
        this.emit('change:path', newPath, oldPath);
    }

    doParamsChange(newParams, oldParams, newLocation) {
        let changedParams = {};
        for (let [key, value] of Object.entries(newParams)) {
            if (value !== oldParams[key]) {
                changedParams[key] = value;
            }
        }
        for (let key of Object.keys(oldParams)) {
            if (!newParams.hasOwnProperty(key)) {
                changedParams[key] = undefined;
            }
        }
        this.emit('change:params', newParams, oldParams, changedParams);
    }

    /**
     * Update route params.  Takes an object of updates.  New parameters
     */
    updateParams(updateParams) {
        let searchParams = this.currentLocation.url.searchParams;
        for (let [key, value] of Object.entries(updateParams)) {
            if (typeof value === 'undefined') {
                searchParams.delete(key);
            } else {
                searchParams.set(key, value);
            }
        }
        this.setQueryString(searchParams.toString());
    }

    getParams() {
        return this.currentLocation.params;
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

    set(path, queryString) {
        location.hash = `${path}?${queryString}`;
    }

    setQueryString(queryString) {
        this.set(this.currentLocation.path, queryString);
    }

    setPath(path) {
        this.set(path, this.currentLocation.queryString);
    }

    route(matcher, callback) {
        this.routes.push({matcher, callback});
    }
}

module.exports = ApplicationRouter;
