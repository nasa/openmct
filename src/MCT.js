define([
    'EventEmitter',
    'legacyRegistry',
    'uuid',
    './api/api',
    'text!./adapter/templates/edit-object-replacement.html',
    './Selection',
    './api/objects/object-utils',
    './api/TimeConductor'
], function (
    EventEmitter,
    legacyRegistry,
    uuid,
    api,
    editObjectTemplate,
    Selection,
    objectUtils,
    TimeConductor
) {

    /**
     * The Open MCT application. This may be configured by installing plugins
     * or registering extensions before the application is started.
     * @class MCT
     * @memberof module:openmct
     * @augments {EventEmitter}
     */
    function MCT() {
        EventEmitter.call(this);
        this.legacyBundle = { extensions: {
            services: [
                {
                    key: "mct",
                    implementation: function () {
                        return this;
                    }.bind(this)
                }
            ]
        } };

        this.selection = new Selection();

        /**
         * MCT's time conductor, which may be used to synchronize view contents
         * for telemetry- or time-based views.
         * @type {module:openmct.TimeConductor}
         * @memberof module:openmct.MCT#
         * @name conductor
         */
        this.conductor = new TimeConductor();

        /**
         * An interface for interacting with the composition of domain objects.
         * The composition of a domain object is the list of other domain
         * objects it "contains" (for instance, that should be displayed
         * beneath it in the tree.)
         *
         * `composition` may be called as a function, in which case it acts
         * as [`composition.get`]{@link module:openmct.CompositionAPI#get}.
         *
         * @type {module:openmct.CompositionAPI}
         * @memberof module:openmct.MCT#
         * @name composition
         */
        this.composition = api.Composition;

        this.TimeConductor = this.conductor; // compatibility for prototype
        this.on('navigation', this.selection.clear.bind(this.selection));
    }

    MCT.prototype = Object.create(EventEmitter.prototype);

    Object.keys(api).forEach(function (k) {
        MCT.prototype[k] = api[k];
    });
    MCT.prototype.MCT = MCT;

    /**
     * An interface for interacting with domain objects and the domain
     * object hierarchy.
     *
     * @type {module:openmct.ObjectAPI}
     * @memberof module:openmct.MCT#
     * @name objects
     */
    MCT.Objects = api.Objects;

    /**
     * An interface for retrieving and interpreting telemetry data associated
     * with a domain object.
     *
     * @type {module:openmct.TelemetryAPI}
     * @memberof module:openmct.MCT#
     * @name telemetry
     */

    MCT.prototype.legacyExtension = function (category, extension) {
        this.legacyBundle.extensions[category] =
            this.legacyBundle.extensions[category] || [];
        this.legacyBundle.extensions[category].push(extension);
    };

    /**
     * Set path to where assets are hosted.  This should be the path to main.js.
     * @memberof module:openmct.MCT#
     * @method setAssetPath
     */
    MCT.prototype.setAssetPath = function (path) {
        this.legacyExtension('constants', {
            key: "ASSETS_PATH",
            value: path
        });
    };

    /**
     * Register a new type of view.
     *
     * @param {string} region the region identifier (see mct.regions)
     * @param {module:openmct.ViewProvider} provider the provider for this view
     * @method view
     * @memberof module:openmct.MCT#
     */
    MCT.prototype.view = function (region, definition) {
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
    };

    /**
     * Register a new [type]{@link module:openmct.Type} of domain object.
     * @param {string} key a unique identifier for this type of object
     * @param {module:openmct.Type} type the new type
     * @memberof module:openmct.MCT#
     * @method type
     */
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

    /**
     * Start running Open MCT. This should be called only after any plugins
     * have been installed.
     * @fires module:openmct.MCT~start
     * @memberof module:openmct.MCT#
     * @method start
     */
    MCT.prototype.start = function () {
        this.legacyExtension('runs', {
            depends: ['navigationService'],
            implementation: function (navigationService) {
                navigationService
                    .addListener(this.emit.bind(this, 'navigation'));
            }.bind(this)
        });

        legacyRegistry.register('adapter', this.legacyBundle);
        legacyRegistry.enable('adapter');
        /**
         * Fired by [MCT]{@link module:openmct.MCT} when the application
         * is started.
         * @event start
         * @memberof module:openmct.MCT~
         */
        this.emit('start');
    };


    /**
     * Install a plugin in MCT.
     *
     * @param {Function} plugin a plugin install function which will be
     *     invoked with the mct instance.
     * @memberof module:openmct.MCT#
     */
    MCT.prototype.install = function (plugin) {
        plugin(this);
    };

    MCT.prototype.regions = {
        main: "MAIN",
        properties: "PROPERTIES",
        toolbar: "TOOLBAR"
    };

    return MCT;
});
