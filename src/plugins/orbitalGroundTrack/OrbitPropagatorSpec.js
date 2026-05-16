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

import OrbitPropagator from './OrbitPropagator.js';

describe('OrbitPropagator', () => {
  const REQUESTED_TLE_LINE1 =
    '1 25544U 98067A   24055.53974537  .00016717  00000-0  30211-3 0  9999';
  const REQUESTED_TLE_LINE2 =
    '2 25544  51.6420 181.7611 0006329  69.4581  44.7865 15.49845347440456';
  const TEST_DATE = new Date('2024-02-24T12:57:14Z');

  it('propagates ISS position correctly from TLE', () => {
    const position = OrbitPropagator.propagate(REQUESTED_TLE_LINE1, REQUESTED_TLE_LINE2, TEST_DATE);

    expect(position).toBeDefined();
    // Values based on actual satellite.js calculation for this specific TLE and Date
    expect(position.latitude).toBeCloseTo(45.76, 2);
    expect(position.longitude).toBeCloseTo(-40.38, 2);
    expect(position.altitude).toBeGreaterThan(400);
  });

  it('returns null for invalid TLE', () => {
    const position = OrbitPropagator.propagate('', '', TEST_DATE);
    expect(position).toBeNull();
  });

  it('calculates multiple ground track points', () => {
    const points = OrbitPropagator.getGroundTrack(
      REQUESTED_TLE_LINE1,
      REQUESTED_TLE_LINE2,
      TEST_DATE,
      10,
      60
    );

    expect(points.length).toBe(11);
    expect(points[0].latitude).toBeCloseTo(45.76, 2);
  });
});
