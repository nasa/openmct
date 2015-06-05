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
/*global define,describe,it,expect,beforeEach,waitsFor,jasmine*/

define(
    ["../../src/controllers/DialogButtonController"],
    function (DialogButtonController) {
        "use strict";

        describe("A dialog button controller", function () {
            var mockScope,
                mockDialogService,
                mockPromise,
                testStructure,
                controller;

            beforeEach(function () {
                mockScope = jasmine.createSpyObj(
                    '$scope',
                    [ '$watch' ]
                );
                mockDialogService = jasmine.createSpyObj(
                    'dialogService',
                    [ 'getUserInput' ]
                );
                mockPromise = jasmine.createSpyObj(
                    'promise',
                    [ 'then' ]
                );
                testStructure = {
                    name: "A Test",
                    glyph: "T",
                    description: "Test description",
                    control: "dialog-button",
                    title: "Test title",
                    dialog: {
                        "control": "textfield",
                        "name": "Inner control"
                    }
                };

                mockScope.field = "testKey";
                mockScope.ngModel = { testKey: "initial test value" };
                mockScope.structure = testStructure;

                mockDialogService.getUserInput.andReturn(mockPromise);

                controller = new DialogButtonController(
                    mockScope,
                    mockDialogService
                );
            });

            it("provides a structure for a button control", function () {
                var buttonStructure;

                // Template is just a mct-control pointing to a button
                // control, so this controller needs to set up all the
                // logic for showing a dialog and collecting user input
                // when that button gets clicked.
                expect(mockScope.$watch).toHaveBeenCalledWith(
                    "structure", // As passed in via mct-control
                    jasmine.any(Function)
                );

                mockScope.$watch.mostRecentCall.args[1](testStructure);

                buttonStructure = controller.getButtonStructure();
                expect(buttonStructure.glyph).toEqual(testStructure.glyph);
                expect(buttonStructure.description).toEqual(testStructure.description);
                expect(buttonStructure.name).toEqual(testStructure.name);
                expect(buttonStructure.click).toEqual(jasmine.any(Function));
            });

            it("shows a dialog when clicked", function () {
                mockScope.$watch.mostRecentCall.args[1](testStructure);
                // Verify precondition - no dialog shown
                expect(mockDialogService.getUserInput).not.toHaveBeenCalled();
                // Click!
                controller.getButtonStructure().click();
                // Should have shown a dialog
                expect(mockDialogService.getUserInput).toHaveBeenCalled();
            });

            it("stores user input to the model", function () {
                var key, input = {};
                // Show dialog, click...
                mockScope.$watch.mostRecentCall.args[1](testStructure);
                controller.getButtonStructure().click();
                // Should be listening to 'then'
                expect(mockPromise.then)
                    .toHaveBeenCalledWith(jasmine.any(Function));
                // Find the key that the dialog should return
                key = mockDialogService.getUserInput.mostRecentCall
                    .args[0].sections[0].rows[0].key;
                // Provide 'user input'
                input[key] = "test user input";
                // Resolve the promise with it
                mockPromise.then.mostRecentCall.args[0](input);
                // ... should have been placed into the model
                expect(mockScope.ngModel.testKey).toEqual("test user input");
            });

            it("supplies initial model state to the dialog", function () {
                var key, state;
                mockScope.$watch.mostRecentCall.args[1](testStructure);
                controller.getButtonStructure().click();
                // Find the key that the dialog should return
                key = mockDialogService.getUserInput.mostRecentCall
                    .args[0].sections[0].rows[0].key;
                // Get the initial state provided to the dialog
                state = mockDialogService.getUserInput.mostRecentCall.args[1];
                // Should have had value from ngModel stored to that key
                expect(state[key]).toEqual("initial test value");
            });
        });
    }
);