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
    ['../src/FormatProvider'],
    function (FormatProvider) {
        'use strict';

        var KEYS = [ 'a', 'b', 'c' ];

        describe("The FormatProvider", function () {
            var mockFormats,
                mockLog,
                mockFormatInstances,
                provider;

            beforeEach(function () {
                mockFormatInstances = KEYS.map(function (k) {
                    return jasmine.createSpyObj(
                        'format-' + k,
                        [ 'parse', 'validate', 'format' ]
                    );
                });
                // Return constructors
                mockFormats = KEYS.map(function (k, i) {
                    function MockFormat() { return mockFormatInstances[i]; }
                    MockFormat.key = k;
                    return MockFormat;
                });
                provider = new FormatProvider(mockFormats);
            });

            it("looks up formats by key", function () {
                KEYS.forEach(function (k, i) {
                    expect(provider.getFormat(k))
                        .toEqual(mockFormatInstances[i]);
                });
            });

            it("throws an error about unknown formats", function () {
                expect(function () {
                    provider.getFormat('some-unknown-format');
                }).toThrow();
            });

        });
    }
);
