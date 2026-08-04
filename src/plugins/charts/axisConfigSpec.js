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
import { DEFAULT_AXIS_CONFIG, getAxisConfig } from './axisConfig.js';

describe('the chart axis configuration helper', () => {
  it('returns the stored configuration for an axis', () => {
    const domainObject = {
      configuration: {
        yAxis: { autoscale: false, range: { min: -2, max: 2 } }
      }
    };

    expect(getAxisConfig(domainObject, 'yAxis')).toEqual({
      autoscale: false,
      range: { min: -2, max: 2 }
    });
  });

  it('reads each axis independently', () => {
    const domainObject = {
      configuration: {
        xAxis: { autoscale: false, range: { min: 0, max: 10 } },
        yAxis: { autoscale: true }
      }
    };

    expect(getAxisConfig(domainObject, 'xAxis').autoscale).toBe(false);
    expect(getAxisConfig(domainObject, 'yAxis').autoscale).toBe(true);
  });

  // Objects created before axis scaling existed have a configuration, but no
  // xAxis/yAxis keys. This is the branch that stands in for a migration.
  it('defaults to auto scale when the axis key is absent', () => {
    const domainObject = {
      configuration: {
        axes: { xKey: 'some-key', yKey: 'other-key' },
        useBar: true
      }
    };

    expect(getAxisConfig(domainObject, 'xAxis')).toEqual(DEFAULT_AXIS_CONFIG);
    expect(getAxisConfig(domainObject, 'yAxis')).toEqual(DEFAULT_AXIS_CONFIG);
    expect(getAxisConfig(domainObject, 'yAxis').autoscale).toBe(true);
  });

  it('defaults to auto scale when there is no configuration at all', () => {
    expect(getAxisConfig({}, 'yAxis')).toEqual(DEFAULT_AXIS_CONFIG);
    expect(getAxisConfig(undefined, 'yAxis')).toEqual(DEFAULT_AXIS_CONFIG);
  });

  // getAxisConfig hands the default back by reference, so an in-place write
  // would leak into every other chart.
  it('exposes a frozen default', () => {
    expect(Object.isFrozen(DEFAULT_AXIS_CONFIG)).toBe(true);
  });
});
