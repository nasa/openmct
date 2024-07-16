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
 * @property {import('./src/selection/Selection').default} selection
 * @property {import('./src/api/time/TimeAPI').default} time
 * @property {import('./src/api/composition/CompositionAPI').default} composition
 * @property {import('./src/ui/registries/ViewRegistry').default} objectViews
 * @property {import('./src/ui/registries/InspectorViewRegistry').default} inspectorViews
 * @property {import('./src/ui/registries/ViewRegistry').default} propertyEditors
 * @property {import('./src/ui/registries/ToolbarRegistry').default} toolbars
 * @property {import('./src/api/types/TypeRegistry').default} types
 * @property {import('./src/api/objects/ObjectAPI').default} objects
 * @property {import('./src/api/telemetry/TelemetryAPI').default} telemetry
 * @property {import('./src/api/indicators/IndicatorAPI').default} indicators
 * @property {import('./src/api/user/UserAPI').default} user
 * @property {import('./src/api/notifications/NotificationAPI').default} notifications
 * @property {import('./src/api/Editor').default} editor
 * @property {import('./src/api/overlays/OverlayAPI')} overlays
 * @property {import('./src/api/tooltips/ToolTipAPI')} tooltips
 * @property {import('./src/api/menu/MenuAPI').default} menus
 * @property {import('./src/api/actions/ActionsAPI').default} actions
 * @property {import('./src/api/status/StatusAPI').default} status
 * @property {import('./src/api/priority/PriorityAPI').default} priority
 * @property {import('./src/ui/router/ApplicationRouter')} router
 * @property {import('./src/api/faultmanagement/FaultManagementAPI').default} faults
 * @property {import('./src/api/forms/FormsAPI').default} forms
 * @property {import('./src/api/Branding').default} branding
 * @property {import('./src/api/annotation/AnnotationAPI').default} annotation
 * @property {{(plugin: OpenMCTPlugin) => void}} install
 * @property {{() => string}} getAssetPath
 * @property {{(assetPath: string) => void}} setAssetPath
 * @property {{(domElement: HTMLElement, isHeadlessMode: boolean) => void}} start
 * @property {{() => void}} startHeadless
 * @property {{() => void}} destroy
 * @property {OpenMCTPlugin[]} plugins
 * @property {OpenMCTComponent[]} components
 */
import { MCT } from './src/MCT.js';

/** @type {OpenMCT} */
const openmct = new MCT();

export default openmct;
