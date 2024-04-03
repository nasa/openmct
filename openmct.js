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
    // eslint-disable-next-line no-undef
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
 * @property {import('./src/selection/Selection.js')} selection
 * @property {import('./src/api/time/TimeAPI.js')} time
 * @property {import('./src/api/composition/CompositionAPI.js')} composition
 * @property {import('./src/ui/registries/ViewRegistry.js')} objectViews
 * @property {import('./src/ui/registries/InspectorViewRegistry.js')} inspectorViews
 * @property {import('./src/ui/registries/ViewRegistry.js')} propertyEditors
 * @property {import('./src/ui/registries/ToolbarRegistry.js')} toolbars
 * @property {import('./src/api/types/TypeRegistry.js')} types
 * @property {import('./src/api/objects/ObjectAPI.js')} objects
 * @property {import('./src/api/telemetry/TelemetryAPI.js')} telemetry
 * @property {import('./src/api/indicators/IndicatorAPI.js')} indicators
 * @property {import('./src/api/user/UserAPI.js')} user
 * @property {import('./src/api/notifications/NotificationAPI.js')} notifications
 * @property {import('./src/api/Editor.js')} editor
 * @property {import('./src/api/overlays/OverlayAPI.js')} overlays
 * @property {import('./src/api/tooltips/ToolTipAPI.js')} tooltips
 * @property {import('./src/api/menu/MenuAPI.js')} menus
 * @property {import('./src/api/actions/ActionsAPI.js')} actions
 * @property {import('./src/api/status/StatusAPI.js')} status
 * @property {import('./src/api/priority/PriorityAPI.js')} priority
 * @property {import('./src/ui/router/ApplicationRouter.js')} router
 * @property {import('./src/api/faultmanagement/FaultManagementAPI.js')} faults
 * @property {import('./src/api/forms/FormsAPI.js')} forms
 * @property {import('./src/api/Branding.js')} branding
 * @property {import('./src/api/annotation/AnnotationAPI.js')} annotation
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
 * @typedef {import('./src/api/objects/ObjectAPI').DomainObject} DomainObject
 * @typedef {import('./src/api/objects/ObjectAPI').Identifier} Identifier
 * @typedef {() => (openmct: OpenMCT) => void} OpenMCTPlugin
 * An OpenMCT Plugin returns a function that receives an instance of
 * the OpenMCT API and uses it to install itself.
 * @param {OpenMCT} openmct - The Open MCT application instance.
 */
