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

import { SCATTER_PLOT_KEY } from './scatterPlotConstants.js';

export default function ScatterPlotCompositionPolicy(openmct) {
  function hasRange(metadata) {
    const rangeValues = metadata.valuesForHints(['range']).map((value) => {
      return value.source;
    });

    const uniqueRangeValues = new Set(rangeValues);

    return uniqueRangeValues && uniqueRangeValues.size > 1;
  }

  function hasScatterPlotTelemetry(domainObject) {
    if (!openmct.telemetry.isTelemetryObject(domainObject)) {
      return false;
    }

    let metadata = openmct.telemetry.getMetadata(domainObject);

    return metadata.values().length > 0 && hasRange(metadata);
  }

  return {
    allow: function (parent, child) {
      if (parent.type === SCATTER_PLOT_KEY) {
        if (child.type === 'conditionSet' || !hasScatterPlotTelemetry(child)) {
          return false;
        }
      }

      return true;
    }
  };
}
