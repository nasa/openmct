/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
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
/* eslint-disable no-undef */
define([
  'EventEmitter',
  './api/api',
  './api/overlays/OverlayAPI',
  './selection/Selection',
  './plugins/plugins',
  './ui/registries/ViewRegistry',
  './plugins/imagery/plugin',
  './ui/registries/InspectorViewRegistry',
  './ui/registries/ToolbarRegistry',
  './ui/router/ApplicationRouter',
  './ui/router/Browse',
  './ui/layout/Layout.vue',
  './ui/preview/plugin',
  './api/Branding',
  './plugins/licenses/plugin',
  './plugins/remove/plugin',
  './plugins/move/plugin',
  './plugins/linkAction/plugin',
  './plugins/duplicate/plugin',
  './plugins/importFromJSONAction/plugin',
  './plugins/exportAsJSONAction/plugin',
  './ui/components/components',
  'vue'
], function (
  EventEmitter,
  api,
  OverlayAPI,
  Selection,
  plugins,
  ViewRegistry,
  ImageryPlugin,
  InspectorViewRegistry,
  ToolbarRegistry,
  ApplicationRouter,
  Browse,
  Layout,
  PreviewPlugin,
  BrandingAPI,
  LicensesPlugin,
  RemoveActionPlugin,
  MoveActionPlugin,
  LinkActionPlugin,
  DuplicateActionPlugin,
  ImportFromJSONAction,
  ExportAsJSONAction,
  components,
  Vue
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
   * @constructor
   * @memberof module:openmct
   */
  function MCT() {
    EventEmitter.call(this);
    this.buildInfo = {
      version: __OPENMCT_VERSION__,
      buildDate: __OPENMCT_BUILD_DATE__,
      revision: __OPENMCT_REVISION__,
      branch: __OPENMCT_BUILD_BRANCH__
    };

    this.destroy = this.destroy.bind(this);
    [
      /**
       * Tracks current selection state of the application.
       * @private
       */
      ['selection', () => new Selection.default(this)],

      /**
       * MCT's time conductor, which may be used to synchronize view contents
       * for telemetry- or time-based views.
       * @type {module:openmct.TimeConductor}
       * @memberof module:openmct.MCT#
       * @name conductor
       */
      ['time', () => new api.TimeAPI(this)],

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
      ['composition', () => new api.CompositionAPI.default(this)],

      /**
       * Registry for views of domain objects which should appear in the
       * main viewing area.
       *
       * @type {module:openmct.ViewRegistry}
       * @memberof module:openmct.MCT#
       * @name objectViews
       */
      ['objectViews', () => new ViewRegistry()],

      /**
       * Registry for views which should appear in the Inspector area.
       * These views will be chosen based on the selection state.
       *
       * @type {module:openmct.InspectorViewRegistry}
       * @memberof module:openmct.MCT#
       * @name inspectorViews
       */
      ['inspectorViews', () => new InspectorViewRegistry.default()],

      /**
       * Registry for views which should appear in Edit Properties
       * dialogs, and similar user interface elements used for
       * modifying domain objects external to its regular views.
       *
       * @type {module:openmct.ViewRegistry}
       * @memberof module:openmct.MCT#
       * @name propertyEditors
       */
      ['propertyEditors', () => new ViewRegistry()],

      /**
       * Registry for views which should appear in the toolbar area while
       * editing. These views will be chosen based on the selection state.
       *
       * @type {module:openmct.ToolbarRegistry}
       * @memberof module:openmct.MCT#
       * @name toolbars
       */
      ['toolbars', () => new ToolbarRegistry()],

      /**
       * Registry for domain object types which may exist within this
       * instance of Open MCT.
       *
       * @type {module:openmct.TypeRegistry}
       * @memberof module:openmct.MCT#
       * @name types
       */
      ['types', () => new api.TypeRegistry()],

      /**
       * An interface for interacting with domain objects and the domain
       * object hierarchy.
       *
       * @type {module:openmct.ObjectAPI}
       * @memberof module:openmct.MCT#
       * @name objects
       */
      ['objects', () => new api.ObjectAPI.default(this.types, this)],

      /**
       * An interface for retrieving and interpreting telemetry data associated
       * with a domain object.
       *
       * @type {module:openmct.TelemetryAPI}
       * @memberof module:openmct.MCT#
       * @name telemetry
       */
      ['telemetry', () => new api.TelemetryAPI.default(this)],

      /**
       * An interface for creating new indicators and changing them dynamically.
       *
       * @type {module:openmct.IndicatorAPI}
       * @memberof module:openmct.MCT#
       * @name indicators
       */
      ['indicators', () => new api.IndicatorAPI(this)],

      /**
       * MCT's user awareness management, to enable user and
       * role specific functionality.
       * @type {module:openmct.UserAPI}
       * @memberof module:openmct.MCT#
       * @name user
       */
      ['user', () => new api.UserAPI(this)],

      ['notifications', () => new api.NotificationAPI()],

      ['editor', () => new api.EditorAPI.default(this)],

      ['overlays', () => new OverlayAPI.default()],

      ['menus', () => new api.MenuAPI(this)],

      ['actions', () => new api.ActionsAPI(this)],

      ['status', () => new api.StatusAPI(this)],

      ['priority', () => api.PriorityAPI],

      ['router', () => new ApplicationRouter(this)],

      ['faults', () => new api.FaultManagementAPI.default(this)],

      ['forms', () => new api.FormsAPI.default(this)],

      ['branding', () => BrandingAPI.default],

      /**
       * MCT's annotation API that enables
       * human-created comments and categorization linked to data products
       * @type {module:openmct.AnnotationAPI}
       * @memberof module:openmct.MCT#
       * @name annotation
       */
      ['annotation', () => new api.AnnotationAPI(this)]
    ].forEach((apiEntry) => {
      const apiName = apiEntry[0];
      const apiObject = apiEntry[1]();

      Object.defineProperty(this, apiName, {
        value: apiObject,
        enumerable: false,
        configurable: false,
        writable: true
      });
    });

    /**
     * MCT's annotation API that enables
     * human-created comments and categorization linked to data products
     * @type {module:openmct.AnnotationAPI}
     * @memberof module:openmct.MCT#
     * @name annotation
     */
    this.annotation = new api.AnnotationAPI(this);

    // Plugins that are installed by default
    this.install(this.plugins.Plot());
    this.install(this.plugins.TelemetryTable.default());
    this.install(PreviewPlugin.default());
    this.install(LicensesPlugin.default());
    this.install(RemoveActionPlugin.default());
    this.install(MoveActionPlugin.default());
    this.install(LinkActionPlugin.default());
    this.install(DuplicateActionPlugin.default());
    this.install(ExportAsJSONAction.default());
    this.install(ImportFromJSONAction.default());
    this.install(this.plugins.FormActions.default());
    this.install(this.plugins.FolderView());
    this.install(this.plugins.Tabs());
    this.install(ImageryPlugin.default());
    this.install(this.plugins.FlexibleLayout());
    this.install(this.plugins.GoToOriginalAction());
    this.install(this.plugins.OpenInNewTabAction());
    this.install(this.plugins.WebPage());
    this.install(this.plugins.Condition());
    this.install(this.plugins.ConditionWidget());
    this.install(this.plugins.URLTimeSettingsSynchronizer());
    this.install(this.plugins.NotificationIndicator());
    this.install(this.plugins.NewFolderAction());
    this.install(this.plugins.ViewDatumAction());
    this.install(this.plugins.ViewLargeAction());
    this.install(this.plugins.ObjectInterceptors());
    this.install(this.plugins.DeviceClassifier());
    this.install(this.plugins.UserIndicator());
    this.install(this.plugins.Gauge());
    this.install(this.plugins.InspectorViews());
  }

  MCT.prototype = Object.create(EventEmitter.prototype);

  MCT.prototype.MCT = MCT;

  /**
   * Set path to where assets are hosted.  This should be the path to main.js.
   * @memberof module:openmct.MCT#
   * @method setAssetPath
   */
  MCT.prototype.setAssetPath = function (assetPath) {
    this._assetPath = assetPath;
  };

  /**
   * Get path to where assets are hosted.
   * @memberof module:openmct.MCT#
   * @method getAssetPath
   */
  MCT.prototype.getAssetPath = function () {
    const assetPathLength = this._assetPath && this._assetPath.length;
    if (!assetPathLength) {
      return '/';
    }

    if (this._assetPath[assetPathLength - 1] !== '/') {
      return this._assetPath + '/';
    }

    return this._assetPath;
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
  MCT.prototype.start = function (domElement = document.body, isHeadlessMode = false) {
    if (this.types.get('layout') === undefined) {
      this.install(
        this.plugins.DisplayLayout({
          showAsView: ['summary-widget']
        })
      );
    }

    this.element = domElement;

    this.router.route(/^\/$/, () => {
      this.router.setPath('/browse/');
    });

    /**
     * Fired by [MCT]{@link module:openmct.MCT} when the application
     * is started.
     * @event start
     * @memberof module:openmct.MCT~
     */

    if (!isHeadlessMode) {
      const appLayout = new Vue({
        components: {
          Layout: Layout.default
        },
        provide: {
          openmct: this
        },
        template: '<Layout ref="layout"></Layout>'
      });
      domElement.appendChild(appLayout.$mount().$el);

      this.layout = appLayout.$refs.layout;
      Browse(this);
    }

    window.addEventListener('beforeunload', this.destroy);

    this.router.start();
    this.emit('start');
  };

  MCT.prototype.startHeadless = function () {
    let unreachableNode = document.createElement('div');

    return this.start(unreachableNode, true);
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

  MCT.prototype.destroy = function () {
    window.removeEventListener('beforeunload', this.destroy);
    this.emit('destroy');
    this.router.destroy();
  };

  MCT.prototype.plugins = plugins;
  MCT.prototype.components = components.default;

  return MCT;
});
