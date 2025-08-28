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
