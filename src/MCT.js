define([
    'EventEmitter',
    'legacyRegistry',
    './api/api',
    './api/objects/bundle'
], function (
    EventEmitter,
    legacyRegistry,
    api
) {
    function MCT() {
        EventEmitter.call(this);
        this.legacyBundle = { extensions: {} };
    }

    MCT.prototype = Object.create(EventEmitter.prototype);

    Object.keys(api).forEach(function (k) {
        MCT.prototype[k] = api[k];
    });

    MCT.prototype.type = function (key, type) {
        var legacyDef = type.toLegacyDefinition();
        legacyDef.key = key;
        this.legacyBundle.extensions.types =
            this.legacyBundle.extensions.types || [];
        this.legacyBundle.extensions.types.push(legacyDef);
    };

    MCT.prototype.start = function () {
        legacyRegistry.register('adapter', this.legacyBundle);
        this.emit('start');
    };

    return MCT;
});
