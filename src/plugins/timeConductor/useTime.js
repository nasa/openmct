/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2024, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

import { useClock } from './useClock.js';
import { useClockOffsets } from './useClockOffsets.js';
import { useTimeBounds } from './useTimeBounds.js';
import { useTimeContext } from './useTimeContext.js';
import { useTimeMode } from './useTimeMode.js';
import { useTimeSystem } from './useTimeSystem.js';

/**
 * @typedef {import('src/api/time/TimeContext.js').default} TimeContext
 * @typedef {import('src/api/time/GlobalTimeContext.js').default} GlobalTimeContext
 * @typedef {import('src/api/telemetry/TelemetryValueFormatter.js').default} TelemetryValueFormatter
 * @typedef {import('src/api/time/TimeContext.js').Mode} Mode
 * @typedef {import('src/api/time/TimeContext.js').Clock} Clock
 * @typedef {import('src/api/time/TimeContext.js').ClockOffsets} ClockOffsets
 * @typedef {import('src/api/time/TimeContext.js').Bounds} Bounds
 */

/**
 * Provides a reactive interface to the time context based on the current object path
 *
 * @param {import('openmct').OpenMCT} openmct - The Open MCT API
 * @param {import('openmct').ObjectPath} objectPath - The path of the object
 * @returns {{
 *   timeContext: TimeContext | GlobalTimeContext,
 *   timeSystemFormatter: import('vue').Ref<TelemetryValueFormatter>,
 *   timeSystemDurationFormatter: import('vue').Ref<TelemetryValueFormatter>,
 *   isTimeSystemUTCBased: import('vue').Ref<boolean>,
 *   timeMode: import('vue').Ref<Mode>,
 *   isFixedTimeMode: import('vue').Ref<boolean>,
 *   isRealTimeMode: import('vue').Ref<boolean>,
 *   getAllModeMetadata: import('vue').Ref<() => void>,
 *   getModeMetadata: import('vue').Ref<() => void>,
 *   bounds: import('vue').Ref<Bounds>,
 *   isTick: import('vue').Ref<boolean>,
 *   offsets: import('vue').Ref<ClockOffsets>,
 *   clock: import('vue').Ref<Clock>,
 *   getAllClockMetadata: import('vue').Ref<() => void>,
 *   getClockMetadata: import('vue').Ref<() => void>
 * }}
 */
export function useTime(openmct, objectPath) {
  const { timeContext } = useTimeContext(openmct, objectPath);
  const { timeSystemFormatter, timeSystemDurationFormatter, isTimeSystemUTCBased } = useTimeSystem(
    openmct,
    timeContext
  );
  const { timeMode, isFixedTimeMode, isRealTimeMode, getAllModeMetadata, getModeMetadata } =
    useTimeMode(openmct, timeContext);
  const { bounds, isTick } = useTimeBounds(openmct, timeContext);
  const { clock, getAllClockMetadata, getClockMetadata } = useClock(openmct, timeContext);
  const { offsets } = useClockOffsets(openmct, timeContext);

  return {
    timeContext,
    timeSystemFormatter,
    timeSystemDurationFormatter,
    isTimeSystemUTCBased,
    timeMode,
    isFixedTimeMode,
    isRealTimeMode,
    getAllModeMetadata,
    getModeMetadata,
    bounds,
    isTick,
    offsets,
    clock,
    getAllClockMetadata,
    getClockMetadata
  };
}
