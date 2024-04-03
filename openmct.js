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

const matcher = /\/openmct.js$/;
if (document.currentScript) {
  let src = document.currentScript.src;
  if (src && matcher.test(src)) {
    __webpack_public_path__ = src.replace(matcher, '') + '/';
  }
}

/**
 * @typedef {Object} BuildInfo
 * @property {string} version
 * @property {string} buildDate
 * @property {string} revision
 * @property {string} branch
 */
/**
 * @typedef {Object} OpenMCT
 * @property {BuildInfo} buildInfo
 * @property {SelectionAPI} selection
 * @property {TimeAPI} time
 * @property {CompositionAPI} composition
 * @property {ViewRegistry} objectViews
 * @property {InspectorViewRegistry} inspectorViews
 * @property {PropertyEditorsRegistry} propertyEditors
 * @property {ToolbarRegistry} toolbars
 * @property {TypeRegistry} types
 * @property {ObjectAPI} objects
 * @property {TelemetryAPI} telemetry
 * @property {IndicatorAPI} indicators
 * @property {UserAPI} user
 * @property {NotificationAPI} notifications
 * @property {EditorAPI} editor
 * @property {OverlayAPI} overlays
 * @property {ToolTipAPI} tooltips
 * @property {MenuAPI} menus
 * @property {ActionsAPI} actions
 * @property {StatusAPI} status
 * @property {PriorityAPI} priority
 * @property {ApplicationRouter} router
 * @property {FaultManagementAPI} faults
 * @property {FormsAPI} forms
 * @property {BrandingAPI} branding
 * @property {AnnotationAPI} annotation
 * @property {{(plugin: OpenMCTPlugin) => void}} install
 * @property {{() => string}} getAssetPath
 * @property {{(assetPath: string) => void}} setAssetPath
 * @property {{(domElement: HTMLElement, isHeadlessMode: boolean) => void}} start
 * @property {{() => void}} startHeadless
 * @property {{() => void}} destroy
 * @property {OpenMCTPlugin[]} plugins
 */
import { MCT } from './src/MCT.js';

/** @type {OpenMCT} */
const openmct = new MCT();

export default openmct;

/**
 * @typedef {import('./src/selection/Selection').default} SelectionAPI
 * @typedef {import('./src/api/time/TimeAPI').default} TimeAPI
 * @typedef {import('./src/api/composition/CompositionAPI').default} CompositionAPI
 * @typedef {import('./src/ui/registries/ViewRegistry').default} ViewRegistry
 * @typedef {import('./src/ui/registries/InspectorViewRegistry').default} InspectorViewRegistry
 * @typedef {import('./src/ui/registries/ViewRegistry').default} PropertyEditorsRegistry
 * @typedef {import('./src/ui/registries/ToolbarRegistry').default} ToolbarRegistry
 * @typedef {import('./src/api/types/TypeRegistry').default} TypeRegistry
 * @typedef {import('./src/api/objects/ObjectAPI').default} ObjectAPI
 * @typedef {import('./src/api/telemetry/TelemetryAPI').default} TelemetryAPI
 * @typedef {import('./src/api/indicators/IndicatorAPI').default} IndicatorAPI
 * @typedef {import('./src/api/user/UserAPI').default} UserAPI
 * @typedef {import('./src/api/notifications/NotificationAPI').default} NotificationAPI
 * @typedef {import('./src/api/Editor').default} EditorAPI
 * @typedef {import('./src/api/overlays/OverlayAPI').default} OverlayAPI
 * @typedef {import('./src/api/tooltips/ToolTipAPI').default} ToolTipAPI
 * @typedef {import('./src/api/menu/MenuAPI').default} MenuAPI
 * @typedef {import('./src/api/actions/ActionsAPI').default} ActionsAPI
 * @typedef {import('./src/api/status/StatusAPI').default} StatusAPI
 * @typedef {import('./src/api/priority/PriorityAPI').default} PriorityAPI
 * @typedef {import('./src/ui/router/ApplicationRouter').default} ApplicationRouter
 * @typedef {import('./src/api/faultmanagement/FaultManagementAPI').default} FaultManagementAPI
 * @typedef {import('./src/api/forms/FormsAPI').default} FormsAPI
 * @typedef {import('./src/api/Branding').default} BrandingAPI
 * @typedef {import('./src/api/annotation/AnnotationAPI').default} AnnotationAPI
 * @typedef {import('./src/api/objects/ObjectAPI').DomainObject} DomainObject
 * @typedef {import('./src/api/objects/ObjectAPI').Identifier} Identifier
 * @typedef {() => (openmct: OpenMCT) => void} OpenMCTPlugin
 * An OpenMCT Plugin returns a function that receives an instance of
 * the OpenMCT API and uses it to install itself.
 * @param {OpenMCT} openmct - The Open MCT application instance.
 */
