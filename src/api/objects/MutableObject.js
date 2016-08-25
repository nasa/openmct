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
     * @constructor
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

    MutableObject.prototype.on = function(path, callback) {
        var fullPath = qualifiedEventName(this.object, path);
        objectEventEmitter.on(fullPath, callback);
        this.unlisteners.push(objectEventEmitter.off.bind(objectEventEmitter, fullPath, callback));
    };

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
