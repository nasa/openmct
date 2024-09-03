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
import CompsInspectorViewProvider from './CompsInspectorViewProvider.js';
import CompsMetadataProvider from './CompsMetadataProvider.js';
import CompsTelemetryProvider from './CompsTelemetryProvider.js';
import CompsViewProvider from './CompsViewProvider.js';

export default function CompsPlugin() {
  const compsManagerPool = {};

  return function install(openmct) {
    openmct.types.addType('comps', {
      name: 'Derived Telemetry',
      key: 'comps',
      description:
        'Add one or more telemetry objects, apply a mathematical operation to them, and republish the result as a new telemetry object.',
      creatable: true,
      cssClass: 'icon-telemetry',
      initialize: function (domainObject) {
        domainObject.configuration = {
          comps: {
            expression: '',
            parameters: [],
            valid: false
          }
        };
        domainObject.composition = [];
        domainObject.telemetry = {};
      }
    });
    openmct.composition.addPolicy((parent, child) => {
      if (parent.type === 'comps' && !openmct.telemetry.isTelemetryObject(child)) {
        return false;
      }
      return true;
    });
    openmct.telemetry.addProvider(new CompsMetadataProvider(openmct, compsManagerPool));
    openmct.telemetry.addProvider(new CompsTelemetryProvider(openmct, compsManagerPool));
    openmct.objectViews.addProvider(new CompsViewProvider(openmct, compsManagerPool));
    openmct.inspectorViews.addProvider(new CompsInspectorViewProvider(openmct, compsManagerPool));
  };
}
