define([
    'EventEmitter',
    'legacyRegistry',
    'uuid',
    './api/api',
    'text!./adapter/templates/edit-object-replacement.html',
    './ui/Dialog',
    './Selection',
    './api/objects/object-utils'
], function (
    EventEmitter,
    legacyRegistry,
    uuid,
    api,
    editObjectTemplate,
    Dialog,
    Selection,
    objectUtils
) {

    /**
     * The Open MCT application, an instance of which is exported
     * by the `mct` module, or exposed as `mct` in the global scope if
     * loaded via a script tag.
     * @constructor module:mct.OpenMCT
     * @augments {EventEmitter}
     */
    function OpenMCT() {
        EventEmitter.call(this);
        this.legacyBundle = { extensions: {} };

        this.selection = new Selection();
        this.on('navigation', this.selection.clear.bind(this.selection));
    }

    OpenMCT.prototype = Object.create(EventEmitter.prototype);

    Object.keys(api).forEach(function (k) {
        OpenMCT.prototype[k] = api[k];
    });
    OpenMCT.prototype.OpenMCT = OpenMCT;

    OpenMCT.prototype.legacyExtension = function (category, extension) {
        this.legacyBundle.extensions[category] =
            this.legacyBundle.extensions[category] || [];
        this.legacyBundle.extensions[category].push(extension);
    };

    /**
     * Set path to where assets are hosted.  This should be the path to main.js.
     */
    OpenMCT.prototype.setAssetPath = function (path) {
        this.legacyExtension('constants', {
            key: "ASSETS_PATH",
            value: path
        });
    };

    /**
     * Register a new type of view.
     *
     * @param region the region identifier (see mct.regions)
     * @param {ViewDefinition} definition the definition for this view
     */
    OpenMCT.prototype.view = function (region, definition) {
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
                        var model = domainObject.getModel();
                        var newDO = objectUtils.toNewFormat(model);
                        return definition.canView(newDO);
                    }
                    return true;
                };
            }
        });

        this.legacyExtension('newViews', {
            factory: definition,
            region: region,
            key: viewKey
        });

        this.legacyExtension('services', {
            key: 'PublicAPI',
            implementation: function () {
                return this;
            }.bind(this)
        });
    };

    OpenMCT.prototype.type = function (key, type) {
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

    OpenMCT.prototype.dialog = function (view, title) {
        return new Dialog(view, title).show();
    };

    OpenMCT.prototype.start = function () {
        this.legacyExtension('runs', {
            depends: ['navigationService'],
            implementation: function (navigationService) {
                navigationService
                    .addListener(this.emit.bind(this, 'navigation'));
            }.bind(this)
        });

        legacyRegistry.register('adapter', this.legacyBundle);
        legacyRegistry.enable('adapter');
        this.emit('start');
    };

    /**
     * Install a plugin in MCT.
     *
     * @param `Function` plugin -- a plugin install function which will be
     *     invoked with the mct instance.
     */
    OpenMCT.prototype.install = function (plugin) {
        plugin(this);
    };

    OpenMCT.prototype.regions = {
        main: "MAIN",
        toolbar: "TOOLBAR"
    };

    return OpenMCT;
});
