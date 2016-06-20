define([
    'EventEmitter',
    'legacyRegistry',
    'uuid',
    './api/api',
    'text!./adapter/templates/edit-object-replacement.html',
    './ui/Dialog',
    './api/events/Events',
    './api/objects/bundle'
], function (
    EventEmitter,
    legacyRegistry,
    uuid,
    api,
    editObjectTemplate,
    Dialog,
    Events
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

    MCT.prototype.legacyExtension = function (category, extension) {
        this.legacyBundle.extensions[category] =
            this.legacyBundle.extensions[category] || [];
        this.legacyBundle.extensions[category].push(extension);
    };

    MCT.prototype.view = function (region, factory) {
        var viewKey = region + uuid();
        var adaptedViewKey = "adapted-view-" + region;

        this.legacyExtension(
            region === this.regions.main ? 'views' : 'representations',
            {
                name: "A view",
                key: adaptedViewKey,
                editable: true,
                template: '<mct-view region="\'' +
                    region +
                    '\'" ' +
                    'key="\'' +
                    viewKey +
                    '\'" ' +
                    'mct-object="domainObject">' +
                    '</mct-view>'
            }
        );

        this.legacyExtension('policies', {
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

        this.legacyExtension('newViews', {
            factory: factory,
            region: region,
            key: viewKey
        });
    };

    MCT.prototype.type = function (key, type) {
        var legacyDef = type.toLegacyDefinition();
        legacyDef.key = key;
        type.key = key;

        this.legacyExtension('types', legacyDef);
        this.legacyExtension('representations', {
            key: "edit-object",
            priority: "preferred",
            template: editObjectTemplate,
            type: key
        });
    };

    MCT.prototype.dialog = function (view, title) {
        return new Dialog(view, title).show();
    };

    MCT.prototype.start = function () {
        legacyRegistry.register('adapter', this.legacyBundle);
        this.emit('start');
    };

    MCT.prototype.regions = {
        main: "MAIN",
        toolbar: "TOOLBAR"
    };

    MCT.prototype.events = new Events();

    MCT.prototype.verbs = {
        mutate: function (domainObject, mutator) {
            return domainObject.useCapability('mutation', mutator)
                .then(function () {
                    var persistence = domainObject.getCapability('persistence');
                    return persistence.persist();
                });
        },
        observe: function (domainObject, callback) {
            var mutation = domainObject.getCapability('mutation');
            return mutation.listen(callback);
        }
    };

    return MCT;
});
