/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2026, United States Government
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
 * Both types persist axis scaling under `configuration.axisScaling`:
 *
 *     axisScaling: {
 *       xAxis: { autoscale: <boolean>, range: { min: <number>, max: <number> } },
 *       yAxis: { ...same... }
 *     }
 *
 * `range` is only meaningful when `autoscale` is `false`. The inner objects
 * deliberately mirror the shape time-domain plots use for their own
 * `configuration.yAxis` (see src/plugins/plot/configuration/YAxisModel.js).
 *
 * These charts have two neighbouring configuration keys that sound similar but
 * are unrelated concerns. Do not confuse them:
 *
 *   configuration.axes         { xKey, yKey } - WHICH telemetry field is
 *                              plotted on each axis.
 *   configuration.axisScaling  HOW each axis is scaled. This file.
 *   configuration.ranges       { domainMin, domainMax, rangeMin, rangeMax } -
 *                              Scatter Plot only. Bounds for the optional
 *                              underlay drawing, set from the create form.
 *                              Applies only when an underlay file is loaded,
 *                              and defers to a fixed range from axisScaling.
 */

/**
 * The persisted configuration key holding all axis scaling.
 */
export const AXIS_SCALING_KEY = 'axisScaling';

/**
 * The default configuration for a single axis. Objects created before axis
 * scaling was introduced have no `axisScaling` key at all, and must read as
 * auto scaled.
 *
 * Frozen because `getAxisConfig` hands this exact object back to callers when
 * the domain object has no stored configuration - mutating it in place would
 * poison the default for every other chart in the application.
 */
export const DEFAULT_AXIS_CONFIG = Object.freeze({ autoscale: true });

/**
 * The default `configuration.axisScaling` for a newly created chart.
 *
 * @returns {{xAxis: Object, yAxis: Object}}
 */
export function getDefaultAxisScaling() {
  return {
    xAxis: { ...DEFAULT_AXIS_CONFIG },
    yAxis: { ...DEFAULT_AXIS_CONFIG }
  };
}

/**
 * Read the scaling configuration for a single axis, falling back to the
 * default for objects persisted before this feature existed.
 *
 * @param {import('openmct').DomainObject} domainObject a Bar Graph or Scatter Plot
 * @param {'xAxis' | 'yAxis'} axisKey which axis to read
 * @returns {{autoscale: boolean, range?: {min: number, max: number}}}
 */
export function getAxisConfig(domainObject, axisKey) {
  return domainObject?.configuration?.[AXIS_SCALING_KEY]?.[axisKey] ?? DEFAULT_AXIS_CONFIG;
}
