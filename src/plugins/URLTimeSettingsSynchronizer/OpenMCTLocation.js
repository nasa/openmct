import objectUtils from '../../api/objects/object-utils.js';

export class OpenMCTLocation {
    constructor(location) {
        this.location = location;
    }
    setSearchParam(paramName, paramValue) {
        this.scheduleSearchParamUpdate(paramName, paramValue);
        this.scheduleSynchronizeWithLocation();
    }
    scheduleSearchParamUpdate(paramName, paramValue) {
        this.pendingLocationUpdates.push((location) => {
            location.searchParams.set(paramName, paramValue);
        })
    }
    getSearchParam(paramName) {
        return this.getHashRelativeURL().searchParams.get(paramName);
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
        this.scheduleSynchronizeWithLocation();
    }
    getObjectPath() {
        return this.getHashRelativeURL().pathname;
    }
    getHashRelativeURL() {
        return new URL(this.location.hash.substring(1), this.location.origin);
    }
}
