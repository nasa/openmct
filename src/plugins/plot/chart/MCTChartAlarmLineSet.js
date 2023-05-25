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

import eventHelpers from '../lib/eventHelpers';

export default class MCTChartAlarmLineSet {
  /**
   * @param {Bounds} bounds
   */
  constructor(series, chart, offset, bounds) {
    this.series = series;
    this.chart = chart;
    this.offset = offset;
    this.bounds = bounds;
    this.limits = [];

    eventHelpers.extend(this);
    this.listenTo(series, 'limitBounds', this.updateBounds, this);
    this.listenTo(series, 'limits', this.getLimitPoints, this);
    this.listenTo(series, 'change:xKey', this.getLimitPoints, this);

    if (series.limits) {
      this.getLimitPoints(series);
    }
  }

  /**
   * @param {Bounds} bounds
   */
  updateBounds(bounds) {
    this.bounds = bounds;
    this.getLimitPoints(this.series);
  }

  color() {
    return this.series.get('color');
  }

  name() {
    return this.series.get('name');
  }

  makePoint(point, series) {
    if (!this.offset.xVal) {
      this.chart.setOffset(point, undefined, series);
    }

    return {
      x: this.offset.xVal(point, series),
      y: this.offset.yVal(point, series)
    };
  }

  getLimitPoints(series) {
    this.limits = [];
    let xKey = series.get('xKey');
    Object.keys(series.limits).forEach((key) => {
      const limitForLevel = series.limits[key];
      if (limitForLevel.high) {
        this.limits.push({
          seriesKey: series.keyString,
          level: key.toLowerCase(),
          name: this.name(),
          seriesColor: series.get('color').asHexString(),
          point: this.makePoint(
            Object.assign({ [xKey]: this.bounds.start }, limitForLevel.high),
            series
          ),
          value: series.getYVal(limitForLevel.high),
          color: limitForLevel.high.color,
          isUpper: true
        });
      }

      if (limitForLevel.low) {
        this.limits.push({
          seriesKey: series.keyString,
          level: key.toLowerCase(),
          name: this.name(),
          seriesColor: series.get('color').asHexString(),
          point: this.makePoint(
            Object.assign({ [xKey]: this.bounds.start }, limitForLevel.low),
            series
          ),
          value: series.getYVal(limitForLevel.low),
          color: limitForLevel.low.color,
          isUpper: false
        });
      }
    }, this);
  }

  reset() {
    this.limits = [];
    if (this.series.limits) {
      this.getLimitPoints(this.series);
    }
  }

  destroy() {
    this.stopListening();
  }
}

/**
@typedef {import('@/api/time/TimeContext').Bounds} Bounds
*/
