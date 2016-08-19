define([
    'lodash'
], function (
    _
) {
    /**
     * The MutableObject wraps a DomainObject and provides getters and
     * setters for
     * @param eventEmitter
     * @param object
     * @constructor
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

    MutableObject.prototype.on = function(path, callback) {
        function synchronizeModel(value) {
            if (path === '*'){
                this.object = value;
            } else {
                _.set(object, path, value)
            }
            callback(value);
        }
        var fullPath = qualifiedEventName(this.object, path);
        var wrappedFunction = synchronizeModel.bind(this);

        this.eventEmitter.on(fullPath, wrappedFunction);
        this.unlisteners.push(this.eventEmitter.off.bind(this.eventEmitter, fullPath, wrappedFunction));
    };

    MutableObject.prototype.set = function (path, value) {

        _.set(this.object, path, value);

        //Emit event specific to property
        this.eventEmitter.emit(qualifiedEventName(this.object, path), value);
        //Emit wildcare event
        this.eventEmitter.emit(qualifiedEventName(this.object, '*'), this.object);
    };

    return MutableObject;
});
