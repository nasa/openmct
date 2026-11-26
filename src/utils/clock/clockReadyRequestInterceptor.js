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

const NO_TICK_YET = 0;

/**
 * Defers realtime requests until a telemetry driven clock has produced its
 * first tick.
 *
 * Such clocks derive their time from incoming telemetry rather than the wall
 * clock, so before any telemetry has arrived they have no time to report and
 * the temporal bounds are meaningless. Rather than let views request data for
 * an arbitrary window, this interceptor parks realtime requests until the
 * clock knows what time it is, then rewrites them with real bounds.
 *
 * This does not deadlock. TelemetryCollection.load() starts its historical
 * request without awaiting it, and then establishes its subscriptions
 * synchronously. Subscriptions are therefore live while a request is parked
 * here, so telemetry can still arrive and produce the tick that releases it.
 *
 * @param {import('../../openmct').OpenMCT} openmct
 * @param {import('./DefaultClock').default} clock the clock whose readiness
 *        gates these requests
 * @returns {import('../../api/telemetry/TelemetryAPI').RequestInterceptorDef}
 */
export default function clockReadyRequestInterceptor(openmct, clock) {
  return {
    appliesTo: (_identifier, request) => {
      const { activeClock } = openmct.time;

      // This type of request does not rely on the clock having bounds.
      if (request.strategy === 'latest' && request.timeContext.isRealTime()) {
        return false;
      }

      return activeClock?.key === clock.key && clock.currentValue() === NO_TICK_YET;
    },
    invoke: async (request) => {
      const timeContext = request?.timeContext ?? openmct.time;

      // Requests for fixed bounds already carry the bounds they want.
      if (timeContext.isRealTime()) {
        const firstTimestamp = await waitForFirstTick(openmct, clock);
        const offsets = timeContext.getClockOffsets();

        request.start = firstTimestamp + offsets.start;
        request.end = firstTimestamp + offsets.end;
      }

      return request;
    }
  };
}

/**
 * Resolves with the clock's first tick value, or immediately with its current
 * value if it has already ticked.
 *
 * Listens on the time context rather than on the clock itself. DefaultClock
 * starts and stops based on its own listener count, so attaching a listener
 * directly to the clock would interfere with its lifecycle.
 */
function waitForFirstTick(openmct, clock) {
  return new Promise((resolve) => {
    if (clock.currentValue() > NO_TICK_YET) {
      resolve(clock.currentValue());

      return;
    }

    function resolveOnFirstTick(timestamp) {
      openmct.time.off('tick', resolveOnFirstTick);
      resolve(timestamp);
    }

    openmct.time.on('tick', resolveOnFirstTick);
  });
}
