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

define([], function () {
  var PURPLE = {
      sin: 2.2,
      cos: 2.2
    },
    RED = {
      sin: 0.9,
      cos: 0.9
    },
    ORANGE = {
      sin: 0.7,
      cos: 0.7
    },
    YELLOW = {
      sin: 0.5,
      cos: 0.5
    },
    CYAN = {
      sin: 0.45,
      cos: 0.45
    },
    LIMITS = {
      rh: {
        cssClass: 'is-limit--upr is-limit--red',
        low: RED,
        high: Number.POSITIVE_INFINITY,
        name: 'Red High'
      },
      rl: {
        cssClass: 'is-limit--lwr is-limit--red',
        high: -RED,
        low: Number.NEGATIVE_INFINITY,
        name: 'Red Low'
      },
      yh: {
        cssClass: 'is-limit--upr is-limit--yellow',
        low: YELLOW,
        high: RED,
        name: 'Yellow High'
      },
      yl: {
        cssClass: 'is-limit--lwr is-limit--yellow',
        low: -RED,
        high: -YELLOW,
        name: 'Yellow Low'
      }
    };

  function SinewaveLimitProvider() {}

  SinewaveLimitProvider.prototype.supportsLimits = function (domainObject) {
    return domainObject.type === 'generator';
  };

  SinewaveLimitProvider.prototype.getLimitEvaluator = function (domainObject) {
    return {
      evaluate: function (datum, valueMetadata) {
        var range = valueMetadata && valueMetadata.key;

        if (datum[range] > RED[range]) {
          return LIMITS.rh;
        }

        if (datum[range] < -RED[range]) {
          return LIMITS.rl;
        }

        if (datum[range] > YELLOW[range]) {
          return LIMITS.yh;
        }

        if (datum[range] < -YELLOW[range]) {
          return LIMITS.yl;
        }
      }
    };
  };

  SinewaveLimitProvider.prototype.getLimits = function (domainObject) {
    return {
      limits: function () {
        return Promise.resolve({
          WATCH: {
            low: {
              color: 'cyan',
              sin: -CYAN.sin,
              cos: -CYAN.cos
            },
            high: {
              color: 'cyan',
              ...CYAN
            }
          },
          WARNING: {
            low: {
              color: 'yellow',
              sin: -YELLOW.sin,
              cos: -YELLOW.cos
            },
            high: {
              color: 'yellow',
              ...YELLOW
            }
          },
          DISTRESS: {
            low: {
              color: 'orange',
              sin: -ORANGE.sin,
              cos: -ORANGE.cos
            },
            high: {
              color: 'orange',
              ...ORANGE
            }
          },
          CRITICAL: {
            low: {
              color: 'red',
              sin: -RED.sin,
              cos: -RED.cos
            },
            high: {
              color: 'red',
              ...RED
            }
          },
          SEVERE: {
            low: {
              color: 'purple',
              sin: -PURPLE.sin,
              cos: -PURPLE.cos
            },
            high: {
              color: 'purple',
              ...PURPLE
            }
          }
        });
      }
    };
  };

  return SinewaveLimitProvider;
});
