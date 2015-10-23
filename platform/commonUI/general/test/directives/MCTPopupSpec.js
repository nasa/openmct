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
    ["../../src/directives/MCTPopup"],
    function (MCTPopup) {
        "use strict";

        var JQLITE_METHODS = [ "on", "off", "find", "parent", "css", "append" ];

        describe("The mct-popup directive", function () {
            var mockCompile,
                mockPopupService,
                mockPopup,
                mockScope,
                mockElement,
                testAttrs,
                mockBody,
                mockTransclude,
                mockParentEl,
                mockNewElement,
                testRect,
                mctPopup;

            function testEvent(x, y) {
                return {
                    pageX: x,
                    pageY: y,
                    preventDefault: jasmine.createSpy("preventDefault")
                };
            }

            beforeEach(function () {
                mockCompile =
                    jasmine.createSpy("$compile");
                mockPopupService =
                    jasmine.createSpyObj("popupService", ["display"]);
                mockPopup =
                    jasmine.createSpyObj("popup", ["dismiss"]);
                mockScope =
                    jasmine.createSpyObj("$scope", [ "$eval", "$apply", "$on" ]);
                mockElement =
                    jasmine.createSpyObj("element", JQLITE_METHODS);
                mockBody =
                    jasmine.createSpyObj("body", JQLITE_METHODS);
                mockTransclude =
                    jasmine.createSpy("transclude");
                mockParentEl =
                    jasmine.createSpyObj("parent", ["getBoundingClientRect"]);
                mockNewElement =
                    jasmine.createSpyObj("newElement", JQLITE_METHODS);

                testAttrs = {
                    mctClickElsewhere: "some Angular expression"
                };
                testRect = {
                    left: 20,
                    top: 42,
                    width: 60,
                    height: 75
                };

                mockCompile.andCallFake(function () {
                    var mockFn = jasmine.createSpy();
                    mockFn.andReturn(mockNewElement);
                    return mockFn;
                });
                mockElement.parent.andReturn([mockParentEl]);
                mockParentEl.getBoundingClientRect.andReturn(testRect);
                mockPopupService.display.andReturn(mockPopup);

                mctPopup = new MCTPopup(mockCompile, mockPopupService);

                mctPopup.link(
                    mockScope,
                    mockElement,
                    testAttrs,
                    null,
                    mockTransclude
                );
            });

            it("is valid as an element", function () {
                expect(mctPopup.restrict).toEqual("E");
            });

            describe("creates an element which", function () {
                it("displays as a popup", function () {
                    expect(mockPopupService.display).toHaveBeenCalledWith(
                        mockNewElement,
                        [ testRect.left, testRect.top ]
                    );
                });

                it("displays transcluded content", function () {
                    var mockClone =
                        jasmine.createSpyObj('clone', JQLITE_METHODS);
                    mockTransclude.mostRecentCall.args[0](mockClone);
                    expect(mockNewElement.append)
                        .toHaveBeenCalledWith(mockClone);
                });

                it("is removed when its containing scope is destroyed", function () {
                    expect(mockPopup.dismiss).not.toHaveBeenCalled();
                    mockScope.$on.calls.forEach(function (call) {
                        if (call.args[0] === '$destroy') {
                            call.args[1]();
                        }
                    });
                    expect(mockPopup.dismiss).toHaveBeenCalled();
                });
            });

        });
    }
);
