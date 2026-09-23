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

export function sumWedgeValues(wedges) {
  return wedges.reduce((sum, wedge) => sum + wedge.value, 0);
}

export function getRemainingValue(wedges, target) {
  return Math.max(0, target - sumWedgeValues(wedges));
}

export function isOvershoot(wedges, target) {
  return sumWedgeValues(wedges) > target;
}

export function getWedgeAngle(value, target, sweepDegrees) {
  if (!target) {
    return 0;
  }

  return (value / target) * sweepDegrees;
}

// Returns wedges with cumulative startAngle/endAngle, capped so the total
// filled sweep never exceeds sweepDegrees even on overshoot.
export function getWedgeSegments(wedges, target, sweepDegrees) {
  let cumulativeAngle = 0;

  return wedges.map((wedge) => {
    const rawAngle = getWedgeAngle(wedge.value, target, sweepDegrees);
    const remainingSweep = Math.max(0, sweepDegrees - cumulativeAngle);
    const angle = Math.min(rawAngle, remainingSweep);
    const startAngle = cumulativeAngle;
    const endAngle = startAngle + angle;

    cumulativeAngle = endAngle;

    return {
      ...wedge,
      startAngle,
      endAngle
    };
  });
}
