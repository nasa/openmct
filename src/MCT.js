define([
    'EventEmitter',
    'legacyRegistry',
    './api/api'
], function (EventEmitter, legacyRegistry, api) {
    function MCT() {
        EventEmitter.call(this);
        this.legacyBundle = { extensions: {} };
    }

    MCT.prototype = Object.create(EventEmitter.prototype);

    Object.keys(api).forEach(function (k) {
        MCT.prototype[k] = api[k];
    });
    MCT.prototype.MCT = MCT;

    MCT.prototype.type = function (key, type) {
        var legacyDef = type.toLegacyDefinition();
        legacyDef.key = key;
        this.legacyBundle.extensions.types =
            this.legacyBundle.extensions.types || [];
        this.legacyBundle.extensions.types.push(legacyDef);

        var viewFactory = type.view(this.regions.main);
        if (viewFactory) {
            this.legacyBundle.extensions.views =
                this.legacyBundle.extensions.views || [];

        }
    };

    MCT.prototype.start = function () {
        legacyRegistry.register('adapter', this.legacyBundle);
        this.emit('start');
    };

    MCT.prototype.regions = {
        main: "MAIN"
    };

    return MCT;
});
