/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2015, United States Government
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
/*global define*/

define(
    [],
    function () {
        "use strict";

        var RED = 0.9,
            YELLOW = 0.5,
            LIMITS = {
                rh: {
                    cssClass: "s-limit-upr s-limit-red",
                    low: RED,
                    high: Number.POSITIVE_INFINITY,
                    name: "Red High"
                },
                rl: {
                    cssClass: "s-limit-lwr s-limit-red",
                    high: -RED,
                    low: Number.NEGATIVE_INFINITY,
                    name: "Red Low"
                },
                yh: {
                    cssClass: "s-limit-upr s-limit-yellow",
                    low: YELLOW,
                    high: RED,
                    name: "Yellow High"
                },
                yl: {
                    cssClass: "s-limit-lwr s-limit-yellow",
                    low: -RED,
                    high: -YELLOW,
                    name: "Yellow Low"
                }
            };

        function SinewaveLimitCapability(domainObject) {
            return {
                limits: function (range) {
                    return LIMITS;
                },
                evaluate: function (datum, range) {
                    range = range || 'sin';
                    if (datum[range] > RED) {
                        return LIMITS.rh;
                    }
                    if (datum[range] < -RED) {
                        return LIMITS.rl;
                    }
                    if (datum[range] > YELLOW) {
                        return LIMITS.yh;
                    }
                    if (datum[range] < -YELLOW) {
                        return LIMITS.yl;
                    }
                }
            };
        }

        SinewaveLimitCapability.appliesTo = function (model) {
            return model.type === 'generator';
        };

        return SinewaveLimitCapability;
    }
);