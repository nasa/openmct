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

define(
    ["./EnumeratedTelemetrySeries"],
    function (EnumeratedTelemetrySeries) {
        "use strict";

        function EnumeratedTelemetryProvider($q, $interval) {
            this.$q = $q;
            this.$interval = $interval;
        }

        EnumeratedTelemetryProvider.prototype.matchRequest = function (
            request
        ) {
            return request.source === 'example.telemetry.enumerated';
        };

        // Return a telemetry series between start and end time with
        // 1000 telemetry points.
        EnumeratedTelemetryProvider.prototype.getSeries = function (
            start,
            end,
            request
        ) {
            var elapsedSeconds = (end - start) / 1000,
                valueEvery = elapsedSeconds / 1000,
                currentSecond = 0,
                values = [],
                currentValue = 0;

            while (currentSecond < elapsedSeconds) {
                values.push({
                    time: +new Date(+start + (currentSecond * 1000)),
                    eu: currentValue
                });
                if ((values.length % Math.pow(3, currentValue + 1)) === 0) {
                    if (currentValue === 3) {
                        currentValue = 0;
                    } else {
                        currentValue += 1;
                    }
                }
                currentSecond += valueEvery;
            }

            return new EnumeratedTelemetrySeries(values);
        };

        EnumeratedTelemetryProvider.prototype.requestTelemetry = function (
            requests
        ) {
            var validRequests = requests.filter(this.matchRequest),
                generatedTelemetry = {},
                response = {
                    'example.telemetry.enumerated': generatedTelemetry
                };

            validRequests.forEach(function (validRequest) {
                var start = validRequest.start,
                    end = validRequest.end;

                if (!end) {
                    end = new Date(Date.now());
                }
                if (!start) {
                    start = new Date(Date.UTC(
                        end.getUTCFullYear(),
                        end.getUTCMonth(),
                        end.getUTCDate() - 1,
                        end.getUTCHours(),
                        end.getUTCMinutes(),
                        end.getUTCSeconds(),
                        end.getUTCMilliseconds()
                    ));
                }
                generatedTelemetry[validRequest.key] =
                    this.getSeries(start, end);
            }, this);

            return this.$q.resolve(response);
        };

        EnumeratedTelemetryProvider.prototype.makeTelemetryEmitter = function (
            request,
            callback
        ) {
            var valueEvery = 1000,
                currentSecond = 0,
                valuesGenerated = 0,
                currentValue = 0,
                interval;

            interval = this.$interval(function () {
                var value = {
                        time: +new Date(Date.now()),
                        eu: currentValue
                    },
                    series = new EnumeratedTelemetrySeries([value]);

                valuesGenerated += 1;
                if ((valuesGenerated % Math.pow(3, currentValue + 1)) === 0) {
                    if (currentValue === 3) {
                        currentValue = 0;
                    } else {
                        currentValue += 1;
                    }
                }

                callback(series);
            }, valueEvery);

            return function () {
                this.$interval.cancel(interval);
            }.bind(this);
        }

        EnumeratedTelemetryProvider.prototype.subscribe = function (
            callback,
            requests
        ) {
            var validRequests = requests.filter(this.matchRequest),
                unsubscribes = validRequests.map(function (request) {
                    var cb = function (series) {
                        var telem = {},
                            response = {
                                'example.telemetry.enumerated': telem
                            };
                        telem[request.key] = series;
                        callback(response);
                    }
                    return this.makeTelemetryEmitter(request, cb);
                }, this)
            return function () {
                unsubscribes.forEach(function(unsubscribe) {
                    unsubscribe();
                });
            };
        };

        return EnumeratedTelemetryProvider;
    }
);
