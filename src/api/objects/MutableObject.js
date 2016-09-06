define([
    'lodash',
    './objectEventEmitter'
], function (
    _,
    objectEventEmitter
) {
    var ANY_OBJECT_EVENT = "mutation";

    /**
     * The MutableObject wraps a DomainObject and provides getters and
     * setters for
     * @param eventEmitter
     * @param object
     * @interface MutableObject
     * @memberof module:openmct
     */
    function MutableObject(object) {
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
        objectEventEmitter.on(fullPath, callback);
        this.unlisteners.push(objectEventEmitter.off.bind(objectEventEmitter, fullPath, callback));
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
        _.set(this.object, 'modified', Date.now());

        //Emit event specific to property
        objectEventEmitter.emit(qualifiedEventName(this.object, path), value);
        //Emit wildcare event
        objectEventEmitter.emit(qualifiedEventName(this.object, '*'), this.object);

        //Emit a general "any object" event
        objectEventEmitter.emit(ANY_OBJECT_EVENT, this.object);
    };

    return MutableObject;
});
