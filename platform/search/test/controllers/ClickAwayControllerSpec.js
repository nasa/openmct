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
    ["../../src/controllers/ClickAwayController"],
    function (ClickAwayController) {
        "use strict";

        describe("The click-away controller", function () {
            var mockScope,
                mockDocument,
                controller;

            beforeEach(function () {
                mockScope = jasmine.createSpyObj(
                    "$scope",
                    [ "$apply" ]
                );
                mockDocument = jasmine.createSpyObj(
                    "$document",
                    [ "on", "off" ]
                );
                controller = new ClickAwayController(mockScope, mockDocument);
            });

            it("is initially inactive", function () {
                expect(controller.isActive()).toBe(false);
            });

            it("does not listen to the document before being toggled", function () {
                expect(mockDocument.on).not.toHaveBeenCalled();
            });

            it("tracks enabled/disabled state when toggled", function () {
                controller.toggle();
                expect(controller.isActive()).toBe(true);
                controller.toggle();
                expect(controller.isActive()).toBe(false);
                controller.toggle();
                expect(controller.isActive()).toBe(true);
                controller.toggle();
                expect(controller.isActive()).toBe(false);
            });

            it("allows active state to be explictly specified", function () {
                controller.setState(true);
                expect(controller.isActive()).toBe(true);
                controller.setState(true);
                expect(controller.isActive()).toBe(true);
                controller.setState(false);
                expect(controller.isActive()).toBe(false);
                controller.setState(false);
                expect(controller.isActive()).toBe(false);
            });

            it("registers a mouse listener when activated", function () {
                controller.setState(true);
                expect(mockDocument.on).toHaveBeenCalled();
            });

            it("deactivates and detaches listener on document click", function () {
                var callback;
                controller.setState(true);
                callback = mockDocument.on.mostRecentCall.args[1];
                callback();
                expect(controller.isActive()).toEqual(false);
                expect(mockDocument.off).toHaveBeenCalledWith("mouseup", callback);
            });



        });
    }
);