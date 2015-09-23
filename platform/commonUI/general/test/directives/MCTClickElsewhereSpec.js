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
    ["../../src/directives/MCTClickElsewhere"],
    function (MCTClickElsewhere) {
        "use strict";

        var JQLITE_METHODS = [ "on", "off", "find", "parent" ];

        describe("The mct-click-elsewhere directive", function () {
            var mockDocument,
                mockScope,
                mockElement,
                testAttrs,
                mockBody,
                mockParentEl,
                testRect,
                mctClickElsewhere;

            function testEvent(x, y) {
                return {
                    pageX: x,
                    pageY: y,
                    preventDefault: jasmine.createSpy("preventDefault")
                };
            }

            beforeEach(function () {
                mockDocument =
                    jasmine.createSpyObj("$document", JQLITE_METHODS);
                mockScope =
                    jasmine.createSpyObj("$scope", [ "$eval", "$apply", "$on" ]);
                mockElement =
                    jasmine.createSpyObj("element", JQLITE_METHODS);
                mockBody =
                    jasmine.createSpyObj("body", JQLITE_METHODS);
                mockParentEl =
                    jasmine.createSpyObj("parent", ["getBoundingClientRect"]);

                testAttrs = {
                    mctClickElsewhere: "some Angular expression"
                };
                testRect = {
                    left: 20,
                    top: 42,
                    width: 60,
                    height: 75
                };

                mockDocument.find.andReturn(mockBody);

                mctClickElsewhere = new MCTClickElsewhere(mockDocument);
                mctClickElsewhere.link(mockScope, mockElement, testAttrs);
            });

            it("is valid as an attribute", function () {
                expect(mctClickElsewhere.restrict).toEqual("A");
            });


        });
    }
);
