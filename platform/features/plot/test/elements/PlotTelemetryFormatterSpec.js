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
/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../../src/elements/PlotTelemetryFormatter"],
    function (PlotTelemetryFormatter) {
        'use strict';

        describe("The PlotTelemetryFormatter", function () {
            var mockFormatter,
                formatter;

            beforeEach(function () {
                mockFormatter = jasmine.createSpyObj(
                    'telemetryFormatter',
                    ['formatDomainValue', 'formatRangeValue']
                );
                formatter = new PlotTelemetryFormatter(mockFormatter);
            });

            describe("using domain & range format keys", function () {
                var rangeFormat = "someRangeFormat",
                    domainFormat = "someDomainFormat";

                beforeEach(function () {
                    formatter.setRangeFormat(rangeFormat);
                    formatter.setDomainFormat(domainFormat);
                });

                it("includes format in formatDomainValue calls", function () {
                    mockFormatter.formatDomainValue.andReturn("formatted!");
                    expect(formatter.formatDomainValue(12321))
                        .toEqual("formatted!");
                    expect(mockFormatter.formatDomainValue)
                        .toHaveBeenCalledWith(12321, domainFormat);
                });

                it("includes format in formatRangeValue calls for strings", function () {
                    mockFormatter.formatRangeValue.andReturn("formatted!");
                    expect(formatter.formatRangeValue('foo'))
                        .toEqual("formatted!");
                    expect(mockFormatter.formatRangeValue)
                        .toHaveBeenCalledWith('foo', rangeFormat);
                });

                it("formats numeric values with three fixed digits", function () {
                    expect(formatter.formatRangeValue(10)).toEqual("10.000");
                });
            });

        });
    }
);
