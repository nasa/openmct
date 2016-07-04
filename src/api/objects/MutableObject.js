define([
    'lodash'
], function (
    _
) {
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
        var fullPath = qualifiedEventName(this.object, path);
        this.eventEmitter.on(fullPath, callback);
        this.unlisteners.push(this.eventEmitter.off.bind(this.eventEmitter, fullPath, callback));
    };

    function getContainer(path) {
        var tokens = path.split('.');
        var container = tokens.slice(0, tokens.length-1).join('.');
        return container;
    }

    MutableObject.prototype.set = function (path, value) {
        var propertyContainer = getContainer(path);

        _.set(this.object, path, value);
        //Emit event specific to property
        this.eventEmitter.emit(qualifiedEventName(this.object, path), value);

        if (propertyContainer.length > 0) {
            this.eventEmitter.emit(qualifiedEventName(this.object, propertyContainer), _.get(this.object, propertyContainer));
        }

        this.eventEmitter.emit(qualifiedEventName(this.object, '*'), this.object);
    };

    MutableObject.prototype.get = function (path) {
        return _.get(this.object, path);
    };

    return MutableObject;
});
