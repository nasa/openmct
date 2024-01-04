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

/**
 * Sums an arbitrary number of absolute rotations (rotations relative to one common direction 0) and normalizes the rotation to the range [0, 360).
 *
 * @param {...number} rotations - Rotations in degrees.
 * @returns {number} - Normalized sum of all rotations in the range [0, 360) degrees.
 */
function rotate(...rotations) {
  const rotation = rotations.reduce((a, b) => a + b, 0);

  return normalizeCompassDirection(rotation);
}

function inRange(degrees, [min, max]) {
  const point = rotate(degrees);

  return min > max
    ? (point >= min && point < 360) || (point <= max && point >= 0)
    : point >= min && point <= max;
}

function percentOfRange(degrees, [min, max]) {
  let distance = rotate(degrees);
  let minRange = min;
  let maxRange = max;

  if (min > max) {
    if (distance < max) {
      distance += 360;
    }

    maxRange += 360;
  }

  return (distance - minRange) / (maxRange - minRange);
}

function normalizeCompassDirection(degrees) {
  const base = degrees % 360;

  return base >= 0 ? base : 360 + base;
}

export { inRange, percentOfRange, rotate };
