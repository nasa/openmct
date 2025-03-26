/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2024, United States Government
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
import { EventEmitter } from 'eventemitter3';
import { createApp, markRaw } from 'vue';

import ActionsAPI from './api/actions/ActionsAPI.js';
import AnnotationAPI from './api/annotation/AnnotationAPI.js';
import BrandingAPI from './api/Branding.js';
import CompositionAPI from './api/composition/CompositionAPI.js';
import EditorAPI from './api/Editor.js';
import FaultManagementAPI from './api/faultmanagement/FaultManagementAPI.js';
import FormsAPI from './api/forms/FormsAPI.js';
import IndicatorAPI from './api/indicators/IndicatorAPI.js';
import MenuAPI from './api/menu/MenuAPI.js';
import NotificationAPI from './api/notifications/NotificationAPI.js';
import ObjectAPI from './api/objects/ObjectAPI.js';
import OverlayAPI from './api/overlays/OverlayAPI.js';
import PriorityAPI from './api/priority/PriorityAPI.js';
import StatusAPI from './api/status/StatusAPI.js';
import TelemetryAPI from './api/telemetry/TelemetryAPI.js';
import TimeAPI from './api/time/TimeAPI.js';
import ToolTipAPI from './api/tooltips/ToolTipAPI.js';
import TypeRegistry from './api/types/TypeRegistry.js';
import UserAPI from './api/user/UserAPI.js';
import DuplicateActionPlugin from './plugins/duplicate/plugin.js';
import ExportAsJSONAction from './plugins/exportAsJSONAction/plugin.js';
import ImageryPlugin from './plugins/imagery/plugin.js';
import ImportFromJSONAction from './plugins/importFromJSONAction/plugin.js';
import LicensesPlugin from './plugins/licenses/plugin.js';
import LinkActionPlugin from './plugins/linkAction/plugin.js';
import MoveActionPlugin from './plugins/move/plugin.js';
import plugins from './plugins/plugins.js';
import RemoveActionPlugin from './plugins/remove/plugin.js';
import Selection from './selection/Selection.js';
import Layout from './ui/layout/AppLayout.vue';
import PreviewPlugin from './ui/preview/plugin.js';
import InspectorViewRegistry from './ui/registries/InspectorViewRegistry.js';
import ToolbarRegistry from './ui/registries/ToolbarRegistry.js';
import ViewRegistry from './ui/registries/ViewRegistry.js';
import ApplicationRouter from './ui/router/ApplicationRouter.js';
import Browse from './ui/router/Browse.js';

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
 */
export class MCT extends EventEmitter {
  /**
   * @type {import('openmct.js').BuildInfo}
   */
  buildInfo;
  /**
   * @type {string}
   */
  defaultClock;
  /**
   * @type {Record<string, OpenMCTPlugin>}
   */
  plugins;
  /**
   * Tracks current selection state of the application.
   * @type {Selection}
   */
  selection;
  constructor() {
    super();

    this.buildInfo = {
      version: __OPENMCT_VERSION__,
      buildDate: __OPENMCT_BUILD_DATE__,
      revision: __OPENMCT_REVISION__,
      branch: __OPENMCT_BUILD_BRANCH__
    };

    this.destroy = this.destroy.bind(this);
    this.defaultClock = 'local';
    this.plugins = plugins;
    this.selection = new Selection(this);

    /**
     * @type {TimeAPI}
     */
    this.time = new TimeAPI(this);

    /**
     * An interface for interacting with the composition of domain objects.
     * The composition of a domain object is the list of other domain
     * objects it "contains" (for instance, that should be displayed
     * beneath it in the tree.)
     *
     * `composition` may be called as a function, in which case it acts
     * as [`composition.get`]{@link module:openmct.CompositionAPI#get}.
     *
     * @type {CompositionAPI}
     */
    this.composition = new CompositionAPI(this);

    /**
     * Registry for views of domain objects which should appear in the
     * main viewing area.
     *
     * @type {ViewRegistry}
     */
    this.objectViews = new ViewRegistry();

    /**
     * Registry for views which should appear in the Inspector area.
     * These views will be chosen based on the selection state.
     *
     * @type {InspectorViewRegistry}
     */
    this.inspectorViews = new InspectorViewRegistry();

    /**
     * Registry for views which should appear in Edit Properties
     * dialogs, and similar user interface elements used for
     * modifying domain objects external to its regular views.
     *
     * @type {ViewRegistry}
     */
    this.propertyEditors = new ViewRegistry();

    /**
     * Registry for views which should appear in the toolbar area while
     * editing. These views will be chosen based on the selection state.
     *
     * @type {ToolbarRegistry}
     */
    this.toolbars = new ToolbarRegistry();

    /**
     * Registry for domain object types which may exist within this
     * instance of Open MCT.
     *
     * @type {TypeRegistry}
     */
    this.types = new TypeRegistry();

    /**
     * An interface for interacting with domain objects and the domain
     * object hierarchy.
     *
     * @type {ObjectAPI}
     */
    this.objects = new ObjectAPI(this.types, this);

    /**
     * An interface for retrieving and interpreting telemetry data associated
     * with a domain object.
     *
     * @type {TelemetryAPI}
     */
    this.telemetry = new TelemetryAPI(this);

    /**
     * An interface for creating new indicators and changing them dynamically.
     *
     * @type {IndicatorAPI}
     */
    this.indicators = new IndicatorAPI(this);

    /**
     * MCT's user awareness management, to enable user and
     * role specific functionality.
     * @type {UserAPI}
     */
    this.user = new UserAPI(this);

    /**
     * An interface for managing notifications and alerts.
     * @type {NotificationAPI}
     */
    this.notifications = new NotificationAPI();

    /**
     * An interface for editing domain objects.
     * @type {EditorAPI}
     */
    this.editor = new EditorAPI(this);

    /**
     * An interface for managing overlays.
     * @type {OverlayAPI}
     */
    this.overlays = new OverlayAPI();

    /**
     * An interface for managing tooltips.
     * @type {ToolTipAPI}
     */
    this.tooltips = new ToolTipAPI();

    /**
     * An interface for managing menus.
     * @type {MenuAPI}
     */
    this.menus = new MenuAPI(this);

    /**
     * An interface for managing menu actions.
     * @type {ActionsAPI}
     */
    this.actions = new ActionsAPI(this);

    /**
     * An interface for managing statuses.
     * @type {StatusAPI}
     */
    this.status = new StatusAPI(this);

    /**
     * An object defining constants for priority levels.
     * @type {PriorityAPI}
     */
    this.priority = PriorityAPI;

    /**
     * An interface for routing application traffic.
     * @type {ApplicationRouter}
     */
    this.router = new ApplicationRouter(this);

    /**
     * An interface for managing faults.
     * @type {FaultManagementAPI}
     */
    this.faults = new FaultManagementAPI(this);

    /**
     * An interface for managing forms.
     * @type {FormsAPI}
     */
    this.forms = new FormsAPI(this);

    /**
     * An interface for branding the application.
     * @type {BrandingAPI}
     */
    this.branding = BrandingAPI;

    /**
     * MCT's annotation API that enables
     * human-created comments and categorization linked to data products
     * @type {AnnotationAPI}
     */
    this.annotation = new AnnotationAPI(this);

    // Plugins that are installed by default
    this.install(this.plugins.Plot());
    this.install(this.plugins.TelemetryTable());
    this.install(PreviewPlugin());
    this.install(LicensesPlugin());
    this.install(RemoveActionPlugin());
    this.install(MoveActionPlugin());
    this.install(LinkActionPlugin());
    this.install(DuplicateActionPlugin());
    this.install(ExportAsJSONAction());
    this.install(ImportFromJSONAction());
    this.install(this.plugins.FormActions());
    this.install(this.plugins.FolderView());
    this.install(this.plugins.Tabs());
    this.install(ImageryPlugin());
    this.install(this.plugins.FlexibleLayout());
    this.install(this.plugins.GoToOriginalAction());
    this.install(this.plugins.OpenInNewTabAction());
    this.install(this.plugins.ReloadAction());
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
  /**
   * Set path to where assets are hosted.  This should be the path to main.js.
   * @method setAssetPath
   */
  setAssetPath(assetPath) {
    this._assetPath = assetPath;
  }
  /**
   * Get path to where assets are hosted.
   * @method getAssetPath
   */
  getAssetPath() {
    const assetPathLength = this._assetPath && this._assetPath.length;
    if (!assetPathLength) {
      return '/';
    }

    if (this._assetPath[assetPathLength - 1] !== '/') {
      return this._assetPath + '/';
    }

    return this._assetPath;
  }
  /**
   * Start running Open MCT. This should be called only after any plugins
   * have been installed.
   * @fires module:openmct.MCT~start
   * @method start
   * @param {Element?} domElement the DOM element in which to run
   *        MCT; if undefined, MCT will be run in the body of the document
   */
  start(domElement = document.body.firstElementChild, isHeadlessMode = false) {
    // Create element to mount Layout if it doesn't exist
    if (domElement === null) {
      domElement = document.createElement('div');
      document.body.appendChild(domElement);
    }
    domElement.id = 'openmct-app';

    if (this.types.get('layout') === undefined) {
      this.install(
        this.plugins.DisplayLayout({
          showAsView: ['summary-widget']
        })
      );
    }

    this.element = domElement;

    if (!this.time.getClock()) {
      this.time.setClock(this.defaultClock);
    }

    this.router.route(/^\/$/, () => {
      this.router.setPath('/browse/');
    });

    /**
     * Fired by [MCT]{@link module:openmct.MCT} when the application
     * is started.
     * @event start
     */
    if (!isHeadlessMode) {
      const appLayout = createApp(Layout);
      appLayout.provide('openmct', markRaw(this));
      const component = appLayout.mount(domElement);
      component.$nextTick(() => {
        this.layout = component;
        this.app = appLayout;
        this.browseRoutes = new Browse(this);
        window.addEventListener('beforeunload', this.destroy);
        this.router.start();
        this.emit('start');
      });
    } else {
      window.addEventListener('beforeunload', this.destroy);

      this.router.start();
      this.emit('start');
    }
  }
  startHeadless() {
    let unreachableNode = document.createElement('div');

    return this.start(unreachableNode, true);
  }
  /**
   * Install a plugin in MCT.
   *
   * @param {Function} plugin a plugin install function which will be
   *     invoked with the mct instance.
   */
  install(plugin) {
    plugin(this);
  }

  destroy() {
    window.removeEventListener('beforeunload', this.destroy);
    this.emit('destroy');
  }
}

/**
 * @typedef {import('../openmct.js').OpenMCTPlugin} OpenMCTPlugin
 */
