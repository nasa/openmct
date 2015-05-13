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
/*global define,describe,it,expect,beforeEach,jasmine*/

define(
    ['../../src/elements/ElementProxies'],
    function (ElementProxies) {
        "use strict";

        // Expect these element types to have proxies
        var ELEMENT_TYPES = [
            "fixed.telemetry",
            "fixed.line",
            "fixed.box",
            "fixed.text",
            "fixed.image"
        ];

        // Verify that the set of proxies exposed matches the specific
        // list above.
        describe("The set of element proxies", function () {
            ELEMENT_TYPES.forEach(function (t) {
                it("exposes a proxy wrapper for " + t + " elements", function () {
                    expect(typeof ElementProxies[t]).toEqual('function');
                });
            });

            it("exposes no additional wrappers", function () {
                expect(Object.keys(ElementProxies).length)
                    .toEqual(ELEMENT_TYPES.length);
            });
        });
    }
);
