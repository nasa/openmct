define([
    'lodash',
    'EventEmitter',
    '../objects/ObjectAPI',
    '../objects/object-utils'
], function (
    _,
    EventEmitter,
    ObjectAPI,
    objectUtils
) {

    function makeEventName(domainObject, event) {
        return event + ':' + objectUtils.makeKeyString(domainObject.key);
    }

    function DefaultCompositionProvider() {
        EventEmitter.call(this);
    }

    DefaultCompositionProvider.prototype =
        Object.create(EventEmitter.prototype);

    DefaultCompositionProvider.prototype.appliesTo = function (domainObject) {
        return !!domainObject.composition;
    };

    DefaultCompositionProvider.prototype.load = function (domainObject) {
        return Promise.all(domainObject.composition.map(ObjectAPI.get));
    };

    DefaultCompositionProvider.prototype.on = function (
        domainObject,
        event,
        listener,
        context
    ) {
        // these can likely be passed through to the mutation service instead
        // of using an eventemitter.
        this.addListener(
            makeEventName(domainObject, event),
            listener,
            context
        );
    };

    DefaultCompositionProvider.prototype.off = function (
        domainObject,
        event,
        listener,
        context
    ) {
        // these can likely be passed through to the mutation service instead
        // of using an eventemitter.
        this.removeListener(
            makeEventName(domainObject, event),
            listener,
            context
        );
    };

    DefaultCompositionProvider.prototype.remove = function (domainObject, child) {
        // TODO: this needs to be synchronized via mutation
        var index = domainObject.composition.indexOf(child);
        domainObject.composition.splice(index, 1);
        this.emit(makeEventName(domainObject, 'remove'), child);
    };

    DefaultCompositionProvider.prototype.add = function (domainObject, child) {
        // TODO: this needs to be synchronized via mutation
        domainObject.composition.push(child.key);
        this.emit(makeEventName(domainObject, 'add'), child);
    };

    return DefaultCompositionProvider;
});
