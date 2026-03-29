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

import { DateTime } from 'luxon';

export default function multiFormat(date) {
  const millis = date instanceof Date ? date.getTime() : date;
  const dt = DateTime.fromMillis(millis, { zone: 'utc' });
  /**
   * Uses logic from d3 Time-Scales, v3 of the API. See
   * https://github.com/d3/d3-3.x-api-reference/blob/master/Time-Scales.md
   *
   * Licensed
   */
  const format = [
    [
      '.SSS',
      function (d) {
        return d.millisecond;
      }
    ],
    [
      ':ss',
      function (d) {
        return d.second;
      }
    ],
    [
      'HH:mm',
      function (d) {
        return d.minute;
      }
    ],
    [
      'HH:mm',
      function (d) {
        return d.hour;
      }
    ],
    [
      'EEE dd',
      function (d) {
        return d.weekday < 7 && d.day !== 1;
      }
    ],
    [
      'MMM dd',
      function (d) {
        return d.day !== 1;
      }
    ],
    [
      'MMMM',
      function (d) {
        return d.month !== 1;
      }
    ],
    [
      'yyyy',
      function () {
        return true;
      }
    ]
  ].filter(function (row) {
    return row[1](dt);
  })[0][0];

  if (format !== undefined) {
    return dt.toFormat(format);
  }
}
