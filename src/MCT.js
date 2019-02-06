/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

define([
    'EventEmitter',
    'legacyRegistry',
    'uuid',
    './api/api',
    './selection/Selection',
    './api/objects/object-utils',
    './plugins/plugins',
    './ui/ViewRegistry',
    './ui/InspectorViewRegistry',
    './ui/ToolbarRegistry',
    './adapter/indicators/legacy-indicators-plugin'
], function (
    EventEmitter,
    legacyRegistry,
    uuid,
    api,
    Selection,
    objectUtils,
    plugins,
    ViewRegistry,
    InspectorViewRegistry,
    ToolbarRegistry,
    LegacyIndicatorsPlugin
) {
    /**
     * Open MCT is an extensible web application for building mission
     * control user interfaces. This module is itself an instance of
     * [MCT]{@link module:openmct.MCT}, which provides an interface for
     * configuring and executing the application.
     *
     * @exports openmct
     */

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
                    key: "openmct",
                    implementation: function ($injector) {
                        this.$injector = $injector;
                        return this;
                    }.bind(this),
                    depends: ['$injector']
                }
            ]
        } };

        /**
         * Tracks current selection state of the application.
         * @private
         */
        this.selection = new Selection(this);

        /**
         * MCT's time conductor, which may be used to synchronize view contents
         * for telemetry- or time-based views.
         * @type {module:openmct.TimeConductor}
         * @memberof module:openmct.MCT#
         * @name conductor
         */
        this.time = new api.TimeAPI();

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
        this.composition = new api.CompositionAPI(this);

        /**
         * Registry for views of domain objects which should appear in the
         * main viewing area.
         *
         * @type {module:openmct.ViewRegistry}
         * @memberof module:openmct.MCT#
         * @name objectViews
         */
        this.objectViews = new ViewRegistry();

        /**
         * Registry for views which should appear in the Inspector area.
         * These views will be chosen based on the selection state.
         *
         * @type {module:openmct.InspectorViewRegistry}
         * @memberof module:openmct.MCT#
         * @name inspectorViews
         */
        this.inspectorViews = new InspectorViewRegistry();

        /**
         * Registry for views which should appear in Edit Properties
         * dialogs, and similar user interface elements used for
         * modifying domain objects external to its regular views.
         *
         * @type {module:openmct.ViewRegistry}
         * @memberof module:openmct.MCT#
         * @name propertyEditors
         */
        this.propertyEditors = new ViewRegistry();

        /**
         * Registry for views which should appear in the status indicator area.
         * @type {module:openmct.ViewRegistry}
         * @memberof module:openmct.MCT#
         * @name indicators
         */
        this.indicators = new ViewRegistry();

        /**
         * Registry for views which should appear in the toolbar area while
         * editing. These views will be chosen based on the selection state.
         *
         * @type {module:openmct.ToolbarRegistry}
         * @memberof module:openmct.MCT#
         * @name toolbars
         */
        this.toolbars = new ToolbarRegistry();

        /**
         * Registry for domain object types which may exist within this
         * instance of Open MCT.
         *
         * @type {module:openmct.TypeRegistry}
         * @memberof module:openmct.MCT#
         * @name types
         */
        this.types = new api.TypeRegistry();

        /**
         * Utilities for attaching common behaviors to views.
         *
         * @type {module:openmct.GestureAPI}
         * @memberof module:openmct.MCT#
         * @name gestures
         */
        this.gestures = new api.GestureAPI();

        /**
         * An interface for interacting with domain objects and the domain
         * object hierarchy.
         *
         * @type {module:openmct.ObjectAPI}
         * @memberof module:openmct.MCT#
         * @name objects
         */
        this.objects = new api.ObjectAPI();

        /**
         * An interface for retrieving and interpreting telemetry data associated
         * with a domain object.
         *
         * @type {module:openmct.TelemetryAPI}
         * @memberof module:openmct.MCT#
         * @name telemetry
         */
        this.telemetry = new api.TelemetryAPI(this);

        /**
         * An interface for creating new indicators and changing them dynamically.
         *
         * @type {module:openmct.IndicatorAPI}
         * @memberof module:openmct.MCT#
         * @name indicators
         */
        this.indicators = new api.IndicatorAPI(this);

        this.Dialog = api.Dialog;

    }

    MCT.prototype = Object.create(EventEmitter.prototype);

    MCT.prototype.MCT = MCT;

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
     * Start running Open MCT. This should be called only after any plugins
     * have been installed.
     * @fires module:openmct.MCT~start
     * @memberof module:openmct.MCT#
     * @method start
     * @param {HTMLElement} [domElement] the DOM element in which to run
     *        MCT; if undefined, MCT will be run in the body of the document
     */
    MCT.prototype.start = function (domElement) {
        if (!domElement) {
            domElement = document.body;
        }

        var appDiv = document.createElement('div');
        appDiv.setAttribute('ng-view', '');
        appDiv.className = 'user-environ';
        domElement.appendChild(appDiv);

        this.legacyExtension('runs', {
            depends: ['navigationService'],
            implementation: function (navigationService) {
                navigationService
                    .addListener(this.emit.bind(this, 'navigation'));
            }.bind(this)
        });

        this.types.listKeys().forEach(function (typeKey) {
            var type = this.types.get(typeKey);
            var legacyDefinition = type.toLegacyDefinition();
            legacyDefinition.key = typeKey;
            this.legacyExtension('types', legacyDefinition);
        }.bind(this));

        this.objectViews.getAllProviders().forEach(function (p) {
            this.legacyExtension('views', {
                key: p.key,
                provider: p,
                name: p.name,
                cssClass: p.cssClass,
                description: p.description,
                editable: p.editable,
                template: '<mct-view mct-provider-key="' + p.key + '"/>'
            });
        }, this);

        legacyRegistry.register('adapter', this.legacyBundle);
        legacyRegistry.enable('adapter');

        this.install(LegacyIndicatorsPlugin());

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

    MCT.prototype.plugins = plugins;

    return MCT;
});
