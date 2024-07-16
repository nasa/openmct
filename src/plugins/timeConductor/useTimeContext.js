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

import { shallowRef, toValue, watchEffect } from 'vue';

/**
 * @typedef {import('@/api/time/TimeContext.js').default} TimeContext
 * @typedef {import('@/api/time/GlobalTimeContext.js').default} GlobalTimeContext
 */

/**
 * Provides the reactive TimeContext
 * for the view's objectPath,
 * or the GlobalTimeContext if objectPath is undefined.
 *
 * @param {OpenMCT} openmct the Open MCT API
 * @param {Array} objectPath The view's objectPath
 * @returns {{
 *   timeContext: TimeContext | GlobalTimeContext
 * }}
 */
export function useTimeContext(openmct, objectPath) {
  const timeContext = shallowRef(null);

  watchEffect(() => getTimeContext());

  function getTimeContext() {
    const path = toValue(objectPath);

    timeContext.value = path !== undefined ? openmct.time.getContextForView(path) : openmct.time;
  }

  return { timeContext };
}
