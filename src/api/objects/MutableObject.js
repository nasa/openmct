define([
    'lodash'
], function (
    _
) {
    /**
     * Provides methods for observing and modifying the state of a domain
     * object.
     *
     * @param eventEmitter
     * @param object
     * @interface MutableObject
     * @memberof module:openmct
     */
    function MutableObject(eventEmitter, object) {
        this.eventEmitter = eventEmitter;
        this.object = object;
        this.unlisteners = [];
    }

    function qualifiedEventName(object, eventName) {
        return [object.key.identifier, eventName].join(':');
    }

    MutableObject.prototype.stopListening = function () {
        this.unlisteners.forEach(function (unlisten) {
            unlisten();
        })
    };

    /**
     * Observe changes to this domain object.
     * @param {string} path the property to observe
     * @param {Function} callback a callback to invoke when new values for
     *        this property are observed
     * @method on
     * @memberof module:openmct.MutableObject#
     */
    MutableObject.prototype.on = function(path, callback) {
        var fullPath = qualifiedEventName(this.object, path);
        this.eventEmitter.on(fullPath, callback);
        this.unlisteners.push(this.eventEmitter.off.bind(this.eventEmitter, fullPath, callback));
    };

    /**
     * Modify this domain object.
     * @param {string} path the property to modify
     * @param {*} value the new value for this property
     * @method set
     * @memberof module:openmct.MutableObject#
     */
    MutableObject.prototype.set = function (path, value) {

        _.set(this.object, path, value);

        //Emit event specific to property
        this.eventEmitter.emit(qualifiedEventName(this.object, path), value);
        //Emit wildcare event
        this.eventEmitter.emit(qualifiedEventName(this.object, '*'), this.object);
    };

    MutableObject.prototype.get = function (path) {
        return _.get(this.object, path);
    };

    return MutableObject;
});
