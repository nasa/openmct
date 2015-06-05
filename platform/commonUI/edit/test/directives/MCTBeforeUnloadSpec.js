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
    ["../../src/directives/MCTBeforeUnload"],
    function (MCTBeforeUnload) {
        "use strict";

        describe("The mct-before-unload directive", function () {
            var mockWindow,
                mockScope,
                testAttrs,
                mockEvent,
                directive;

            function fireListener(eventType, value) {
                mockScope.$on.calls.forEach(function (call) {
                    if (call.args[0] === eventType) {
                        call.args[1](value);
                    }
                });
            }

            beforeEach(function () {
                mockWindow = jasmine.createSpyObj("$window", ['confirm']);
                mockScope = jasmine.createSpyObj("$scope", ['$eval', '$on']);
                testAttrs = { mctBeforeUnload: "someExpression" };
                mockEvent = jasmine.createSpyObj("event", ["preventDefault"]);
                directive = new MCTBeforeUnload(mockWindow);
                directive.link(mockScope, {}, testAttrs);
            });

            it("can be used only as an attribute", function () {
                expect(directive.restrict).toEqual('A');
            });

            it("listens for beforeunload", function () {
                expect(mockWindow.onbeforeunload).toEqual(jasmine.any(Function));
            });

            it("listens for route changes", function () {
                expect(mockScope.$on).toHaveBeenCalledWith(
                    "$locationChangeStart",
                    jasmine.any(Function)
                );
            });

            it("listens for its scope's destroy event", function () {
                expect(mockScope.$on).toHaveBeenCalledWith(
                    "$destroy",
                    jasmine.any(Function)
                );
            });

            it("uses result of evaluated expression as a warning", function () {
                mockScope.$eval.andReturn(undefined);
                expect(mockWindow.onbeforeunload(mockEvent)).toBeUndefined();
                mockScope.$eval.andReturn("some message");
                expect(mockWindow.onbeforeunload(mockEvent)).toEqual("some message");
                // Verify that the right expression was evaluated
                expect(mockScope.$eval).toHaveBeenCalledWith(testAttrs.mctBeforeUnload);
            });

            it("confirms route changes", function () {
                // First, try with no unsaved changes;
                // should not confirm or preventDefault
                mockScope.$eval.andReturn(undefined);
                fireListener("$locationChangeStart", mockEvent);
                expect(mockWindow.confirm).not.toHaveBeenCalled();
                expect(mockEvent.preventDefault).not.toHaveBeenCalled();

                // Next, try with unsaved changes that the user confirms;
                // should prompt, but not preventDefault
                mockScope.$eval.andReturn("some message");
                mockWindow.confirm.andReturn(true);
                fireListener("$locationChangeStart", mockEvent);
                expect(mockWindow.confirm).toHaveBeenCalledWith("some message");
                expect(mockEvent.preventDefault).not.toHaveBeenCalled();

                // Finally, act as if the user said no to this dialog;
                // this should preventDefault on the location change.
                mockWindow.confirm.andReturn(false);
                fireListener("$locationChangeStart", mockEvent);
                expect(mockWindow.confirm).toHaveBeenCalledWith("some message");
                expect(mockEvent.preventDefault).toHaveBeenCalled();
            });

            it("cleans up listeners when destroyed", function () {
                fireListener("$destroy", mockEvent);
                expect(mockWindow.onbeforeunload).toBeUndefined();
            });


        });
    }
);