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

const ALLOWED_TYPES = ['telemetry.plot.overlay', 'telemetry.plot.stacked', 'plan', 'gantt-chart'];
const DISALLOWED_TYPES = ['telemetry.plot.bar-graph', 'telemetry.plot.scatter-plot'];
export default function TimelineCompositionPolicy(openmct) {
  function hasNumericTelemetry(domainObject, metadata) {
    const hasTelemetry = openmct.telemetry.isTelemetryObject(domainObject);
    if (!hasTelemetry || !metadata) {
      return false;
    }

    return metadata.values().length > 0 && hasDomainAndRange(metadata);
  }

  function hasDomainAndRange(metadata) {
    return (
      metadata.valuesForHints(['range']).length > 0 &&
      metadata.valuesForHints(['domain']).length > 0
    );
  }

  function hasImageTelemetry(domainObject, metadata) {
    if (!metadata) {
      return false;
    }

    return metadata.valuesForHints(['image']).length > 0;
  }

  return {
    allow: function (parent, child) {
      if (parent.type === 'time-strip') {
        const metadata = openmct.telemetry.getMetadata(child);

        if (
          !DISALLOWED_TYPES.includes(child.type) &&
          (hasNumericTelemetry(child, metadata) ||
            hasImageTelemetry(child, metadata) ||
            ALLOWED_TYPES.includes(child.type))
        ) {
          return true;
        }

        return false;
      }

      return true;
    }
  };
}
