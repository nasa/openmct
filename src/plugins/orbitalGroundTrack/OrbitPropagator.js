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
 *****************************************************************************/

import * as satellite from 'satellite.js';

/**
 * Utility class for satellite orbital propagation using SGP4/SDP4 models.
 * Converts Two-Line Element (TLE) data into geodetic coordinates.
 */
export default class OrbitPropagator {
  /**
   * Propagates satellite position from TLE at a given time.
   * @param {string} line1
   * @param {string} line2
   * @param {Date} date
   * @returns {Object|null}
   */
  static propagate(line1, line2, date) {
    if (!line1 || !line2 || !date) {
      return null;
    }

    try {
      const satrec = satellite.twoline2satrec(line1, line2);
      const positionAndVelocity = satellite.propagate(satrec, date);
      const positionEci = positionAndVelocity.position;

      if (!positionEci) {
        return null;
      }

      const gmst = satellite.gstime(date);
      const positionGd = satellite.eciToGeodetic(positionEci, gmst);

      const longitude = satellite.degreesLong(positionGd.longitude);
      const latitude = satellite.degreesLat(positionGd.latitude);
      const altitude = positionGd.height;

      return {
        latitude,
        longitude,
        altitude
      };
    } catch (e) {
      console.error('Orbit propagation failed:', e);

      return null;
    }
  }

  /**
   * Calculates a series of points for the ground track over a specified duration.
   * @param {string} line1
   * @param {string} line2
   * @param {Date} startDate
   * @param {number} duration
   * @param {number} [stepSeconds=60]
   * @returns {Object[]}
   */
  static getGroundTrack(line1, line2, startDate, duration, stepSeconds = 60) {
    const points = [];
    const startTimestamp = startDate.getTime();
    const endTimestamp = startTimestamp + duration * 60 * 1000;

    for (let t = startTimestamp; t <= endTimestamp; t += stepSeconds * 1000) {
      const pos = this.propagate(line1, line2, new Date(t));
      if (pos) {
        points.push(pos);
      }
    }

    return points;
  }
}
