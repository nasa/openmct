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
 * Intercepts requests to ensure the remote clock is ready.
 *
 * @param {import('../../openmct').OpenMCT} openmct - The OpenMCT instance.
 * @param {import('../../openmct').Identifier} _remoteClockIdentifier - The identifier for the remote clock.
 * @param {Function} waitForBounds - A function that returns a promise resolving to the initial bounds.
 * @returns {Object} The request interceptor.
 */
function remoteClockRequestInterceptor(openmct, _remoteClockIdentifier, waitForBounds) {
  let remoteClockLoaded = false;

  return {
    /**
     * Determines if the interceptor applies to the given request.
     *
     * @param {Object} _ - Unused parameter.
     * @param {import('../../api/telemetry/TelemetryAPI').TelemetryRequestOptions} request - The request object.
     * @returns {boolean} True if the interceptor applies, false otherwise.
     */
    appliesTo: (_, request) => {
      // Get the activeClock from the Global Time Context
      /** @type {import("../../api/time/TimeContext").default} */
      const { activeClock } = openmct.time;

      // this type of request does not rely on clock having bounds
      if (request.strategy === 'latest' && request.timeContext.isRealTime()) {
        return false;
      }

      return activeClock?.key === 'remote-clock' && !remoteClockLoaded;
    },
    /**
     * Invokes the interceptor to modify the request.
     *
     * @param {Object} request - The request object.
     * @returns {Promise<Object>} The modified request object.
     */
    invoke: async (request) => {
      const timeContext = request?.timeContext ?? openmct.time;

      // Wait for initial bounds if the request is for real-time data.
      // Otherwise, use the bounds provided by the request.
      if (timeContext.isRealTime()) {
        const { start, end } = await waitForBounds();
        remoteClockLoaded = true;
        request.start = start;
        request.end = end;
      }

      return request;
    }
  };
}

export default remoteClockRequestInterceptor;
