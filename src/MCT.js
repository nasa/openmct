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
import EventEmitter from 'EventEmitter';
import { createApp, markRaw } from 'vue';

import ActionsAPI from './api/actions/ActionsAPI';
import AnnotationAPI from './api/annotation/AnnotationAPI';
import BrandingAPI from './api/Branding';
import CompositionAPI from './api/composition/CompositionAPI';
import EditorAPI from './api/Editor';
import FaultManagementAPI from './api/faultmanagement/FaultManagementAPI';
import FormsAPI from './api/forms/FormsAPI';
import IndicatorAPI from './api/indicators/IndicatorAPI';
import MenuAPI from './api/menu/MenuAPI';
import NotificationAPI from './api/notifications/NotificationAPI';
import ObjectAPI from './api/objects/ObjectAPI';
import OverlayAPI from './api/overlays/OverlayAPI';
import PriorityAPI from './api/priority/PriorityAPI';
import StatusAPI from './api/status/StatusAPI';
import TelemetryAPI from './api/telemetry/TelemetryAPI';
import TimeAPI from './api/time/TimeAPI';
import ToolTipAPI from './api/tooltips/ToolTipAPI';
import TypeRegistry from './api/types/TypeRegistry';
import UserAPI from './api/user/UserAPI';
import DuplicateActionPlugin from './plugins/duplicate/plugin';
import ExportAsJSONAction from './plugins/exportAsJSONAction/plugin';
import ImageryPlugin from './plugins/imagery/plugin';
import ImportFromJSONAction from './plugins/importFromJSONAction/plugin';
import LicensesPlugin from './plugins/licenses/plugin';
import LinkActionPlugin from './plugins/linkAction/plugin';
import MoveActionPlugin from './plugins/move/plugin';
import plugins from './plugins/plugins';
import RemoveActionPlugin from './plugins/remove/plugin';
import Selection from './selection/Selection';
import Layout from './ui/layout/AppLayout.vue';
import PreviewPlugin from './ui/preview/plugin';
import InspectorViewRegistry from './ui/registries/InspectorViewRegistry';
import ToolbarRegistry from './ui/registries/ToolbarRegistry';
import ViewRegistry from './ui/registries/ViewRegistry';
import ApplicationRouter from './ui/router/ApplicationRouter';
import Browse from './ui/router/Browse';

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
export class MCT extends EventEmitter {
  constructor() {
    super();
    EventEmitter.call(this);

    this.buildInfo = {
      version: __OPENMCT_VERSION__,
      buildDate: __OPENMCT_BUILD_DATE__,
      revision: __OPENMCT_REVISION__,
      branch: __OPENMCT_BUILD_BRANCH__
    };

    this.destroy = this.destroy.bind(this);
    this.defaultClock = 'local';

    this.plugins = plugins;

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
     * @type {module:openmct.CompositionAPI}
     * @memberof module:openmct.MCT#
     * @name composition
     */
    this.composition = new CompositionAPI(this);

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
    this.types = new TypeRegistry();

    /**
     * An interface for interacting with domain objects and the domain
     * object hierarchy.
     *
     * @type {module:openmct.ObjectAPI}
     * @memberof module:openmct.MCT#
     * @name objects
     */
    this.objects = new ObjectAPI(this.types, this);

    /**
     * An interface for retrieving and interpreting telemetry data associated
     * with a domain object.
     *
     * @type {module:openmct.TelemetryAPI}
     * @memberof module:openmct.MCT#
     * @name telemetry
     */
    this.telemetry = new TelemetryAPI(this);

    /**
     * An interface for creating new indicators and changing them dynamically.
     *
     * @type {module:openmct.IndicatorAPI}
     * @memberof module:openmct.MCT#
     * @name indicators
     */
    this.indicators = new IndicatorAPI(this);

    /**
     * MCT's user awareness management, to enable user and
     * role specific functionality.
     * @type {module:openmct.UserAPI}
     * @memberof module:openmct.MCT#
     * @name user
     */
    this.user = new UserAPI(this);

    this.notifications = new NotificationAPI();
    this.editor = new EditorAPI(this);
    this.overlays = new OverlayAPI();
    this.tooltips = new ToolTipAPI();
    this.menus = new MenuAPI(this);
    this.actions = new ActionsAPI(this);
    this.status = new StatusAPI(this);
    this.priority = PriorityAPI;
    this.router = new ApplicationRouter(this);
    this.faults = new FaultManagementAPI(this);
    this.forms = new FormsAPI(this);
    this.branding = BrandingAPI;

    /**
     * MCT's annotation API that enables
     * human-created comments and categorization linked to data products
     * @type {module:openmct.AnnotationAPI}
     * @memberof module:openmct.MCT#
     * @name annotation
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
   * @memberof module:openmct.MCT#
   * @method setAssetPath
   */
  setAssetPath(assetPath) {
    this._assetPath = assetPath;
  }
  /**
   * Get path to where assets are hosted.
   * @memberof module:openmct.MCT#
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
   * @memberof module:openmct.MCT#
   * @method start
   * @param {HTMLElement} [domElement] the DOM element in which to run
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
     * @memberof module:openmct.MCT~
     */
    if (!isHeadlessMode) {
      const appLayout = createApp(Layout);
      appLayout.provide('openmct', markRaw(this));
      const component = appLayout.mount(domElement);
      component.$nextTick(() => {
        this.layout = component;
        this.app = appLayout;
        Browse(this);
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
   * @memberof module:openmct.MCT#
   */
  install(plugin) {
    plugin(this);
  }

  destroy() {
    window.removeEventListener('beforeunload', this.destroy);
    this.emit('destroy');
    this.router.destroy();
  }
}
