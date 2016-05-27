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
            var viewKey = key + "." + this.regions.main;

            this.legacyBundle.extensions.views =
                this.legacyBundle.extensions.views || [];
            this.legacyBundle.extensions.views.push({
                name: "A view",
                key: "adapted-view",
                template: '<mct-view key="\'' +
                    viewKey +
                    '\'" ' +
                    'mct-object="domainObject">' +
                    '</mct-view>'
            });

            this.legacyBundle.extensions.newViews =
                this.legacyBundle.extensions.newViews || [];
            this.legacyBundle.extensions.newViews.push({
                factory: viewFactory,
                key: viewKey
            });
        }
    };

    MCT.prototype.start = function () {
        legacyRegistry.register('adapter', this.legacyBundle);
        this.emit('start');
    };

    MCT.prototype.regions = {
        main: "MAIN"
    };

    MCT.prototype.verbs = {
        mutate: function (domainObject, mutator) {
            return domainObject.useCapability('mutation', mutator)
                .then(function () {
                    var persistence = domainObject.getCapability('persistence');
                    return persistence.persist();
                });
        }
    };

    return MCT;
});
