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

/**
 * Axis scaling configuration shared by the Bar Graph and Scatter Plot views.
 *
 * Both types persist their axis scaling under `configuration.xAxis` and
 * `configuration.yAxis`, mirroring the shape used by time-domain plots:
 *
 *     { autoscale: <boolean>, range: { min: <number>, max: <number> } }
 *
 * `range` is only meaningful when `autoscale` is `false`.
 */

/**
 * The default axis configuration. Objects created before axis scaling was
 * introduced have neither key, and must read as auto scaled.
 *
 * Frozen because `getAxisConfig` hands this exact object back to callers when
 * the domain object has no stored configuration - mutating it in place would
 * poison the default for every other chart in the application.
 */
export const DEFAULT_AXIS_CONFIG = Object.freeze({ autoscale: true });

/**
 * Read the scaling configuration for a single axis, falling back to the
 * default for objects persisted before this feature existed.
 *
 * @param {import('openmct').DomainObject} domainObject a Bar Graph or Scatter Plot
 * @param {'xAxis' | 'yAxis'} axisKey which axis to read
 * @returns {{autoscale: boolean, range?: {min: number, max: number}}}
 */
export function getAxisConfig(domainObject, axisKey) {
  return domainObject?.configuration?.[axisKey] ?? DEFAULT_AXIS_CONFIG;
}
