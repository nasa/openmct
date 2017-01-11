/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
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

define(
    ["../../src/controllers/ClickAwayController"],
    (ClickAwayController) => {

        describe("The click-away controller", () => {
            let mockDocument,
                mockTimeout,
                controller;

            beforeEach( () => {
                mockDocument = jasmine.createSpyObj(
                    "$document",
                    ["on", "off"]
                );
                mockTimeout = jasmine.createSpy('timeout');
                controller = new ClickAwayController(
                    mockDocument,
                    mockTimeout
                );
            });

            it("is initially inactive", () => {
                expect(controller.isActive()).toBe(false);
            });

            it("does not listen to the document before being toggled", () => {
                expect(mockDocument.on).not.toHaveBeenCalled();
            });

            it("tracks enabled/disabled state when toggled", () => {
                controller.toggle();
                expect(controller.isActive()).toBe(true);
                controller.toggle();
                expect(controller.isActive()).toBe(false);
                controller.toggle();
                expect(controller.isActive()).toBe(true);
                controller.toggle();
                expect(controller.isActive()).toBe(false);
            });

            it("allows active state to be explicitly specified", () => {
                controller.setState(true);
                expect(controller.isActive()).toBe(true);
                controller.setState(true);
                expect(controller.isActive()).toBe(true);
                controller.setState(false);
                expect(controller.isActive()).toBe(false);
                controller.setState(false);
                expect(controller.isActive()).toBe(false);
            });

            it("registers a mouse listener when activated", () => {
                controller.setState(true);
                expect(mockDocument.on).toHaveBeenCalled();
            });

            it("deactivates and detaches listener on document click", () => {
                let callback, timeout;
                controller.setState(true);
                callback = mockDocument.on.mostRecentCall.args[1];
                callback();
                timeout = mockTimeout.mostRecentCall.args[0];
                timeout();
                expect(controller.isActive()).toEqual(false);
                expect(mockDocument.off).toHaveBeenCalledWith("mouseup", callback);
            });
        });
    }
);
