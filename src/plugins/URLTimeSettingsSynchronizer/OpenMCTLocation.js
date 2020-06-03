import objectUtils from '../../api/objects/object-utils.js';
import _ from 'lodash';

export class OpenMCTLocation {
    constructor() {
        this.synchronizeWithLocation = _.debounce(this.synchronizeWithLocation);
    }
    setSearchParam(paramName, paramValue) {
        this.scheduleSearchParamUpdate(paramName, paramValue);
    }
    getSearchParam(paramName) {
        return this.getHashRelativeURL().searchParams.get(paramName);
    }
    getObjectPath() {
        return this.getHashRelativeURL().pathname;
    }
    setObjectPath(objectPath) {
        let objectPathString;

        if (objectPath instanceof Array) {
            objectPathString = objectPath.reduce((pathString, object) => {
                return `${pathString}/${objectUtils.makeKeyString(object.identifier)}`;
            });
        } else {
            objectPathString = objectPath
        }

        this.schedulePathUpdate(objectPathString);
    }

    /**
     * @private
     * @param {String} paramName
     * @param {String} paramValue
     */
    scheduleSearchParamUpdate(paramName, paramValue) {
        this.pendingLocationUpdates.push((url) => {
            url.searchParams.set(paramName, paramValue);
        });
        this.synchronizeWithLocation();
    }

    /**
     * @private
     * @param {String} path
     */
    schedulePathUpdate(path) {
        this.pendingLocationUpdates.push((url) => {
            url.pathName = path;
        });
        this.synchronizeWithLocation();
    }

    synchronizeWithLocation() {
        let url = this.getHashRelativeURL();
        this.pendingLocationUpdates.forEach(
            updateFunction => updateFunction(url)
        );
        this.location.hash = `${url.pathname}${url.search}`;
    }

    /**
     * @private
     */
    getHashRelativeURL() {
        return new URL(window.location.hash.substring(1), window.location.origin);
    }
}
