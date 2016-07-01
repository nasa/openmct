define([
    'EventEmitter',
    'legacyRegistry',
    'uuid',
    './api/api',
    './api/objects/bundle'
], function (
    EventEmitter,
    legacyRegistry,
    uuid,
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
    MCT.prototype.MCT = MCT;

    MCT.prototype.view = function (region, factory) {
        var viewKey = region + uuid();
        var adaptedViewKey = "adapted-view-" + viewKey;

        this.legacyBundle.extensions.views =
            this.legacyBundle.extensions.views || [];
        this.legacyBundle.extensions.views.push({
            name: "A view",
            key: adaptedViewKey,
            template: '<mct-view key="\'' +
                viewKey +
                '\'" ' +
                'mct-object="domainObject">' +
                '</mct-view>'
        });

        this.legacyBundle.extensions.policies =
            this.legacyBundle.extensions.policies || [];
        this.legacyBundle.extensions.policies.push({
            category: "view",
            implementation: function Policy() {
                this.allow = function (view, domainObject) {
                    if (view.key === adaptedViewKey) {
                        return !!factory(domainObject);
                    }
                    return true;
                };
            }
        });

        this.legacyBundle.extensions.newViews =
            this.legacyBundle.extensions.newViews || [];
        this.legacyBundle.extensions.newViews.push({
            factory: factory,
            key: viewKey
        });
    };

    MCT.prototype.type = function (key, type) {
        var legacyDef = type.toLegacyDefinition();
        legacyDef.key = key;
        this.legacyBundle.extensions.types =
            this.legacyBundle.extensions.types || [];
        this.legacyBundle.extensions.types.push(legacyDef);

        type.key = key;
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
