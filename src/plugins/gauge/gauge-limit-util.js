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
const GAUGE_LIMITS = {
  q1: 0,
  q2: 90,
  q3: 180,
  q4: 270
};

export const DIAL_VALUE_DEG_OFFSET = 45;

// type: low, high
// quadrant: low, mid, high, max
export function getLimitDegree(type, quadrant) {
  if (quadrant === 'max') {
    return GAUGE_LIMITS.q4 + DIAL_VALUE_DEG_OFFSET;
  }

  return type === 'low' ? getLowLimitDegree(quadrant) : getHighLimitDegree(quadrant);
}

function getLowLimitDegree(quadrant) {
  return GAUGE_LIMITS[quadrant] + DIAL_VALUE_DEG_OFFSET;
}

function getHighLimitDegree(quadrant) {
  if (quadrant === 'q1') {
    return GAUGE_LIMITS.q4 + DIAL_VALUE_DEG_OFFSET;
  }

  if (quadrant === 'q2') {
    return GAUGE_LIMITS.q3 + DIAL_VALUE_DEG_OFFSET;
  }

  if (quadrant === 'q3') {
    return GAUGE_LIMITS.q2 + DIAL_VALUE_DEG_OFFSET;
  }
}
