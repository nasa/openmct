/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2017, United States Government
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
    ["../src/MCTFileInput"],
    function (MCTFileInput) {

        describe("The mct-file-input directive", function () {

            var mockScope,
                mockFileInputService,
                mctFileInput,
                element,
                attrs,
                control;

            beforeEach(function () {
                attrs = [];
                control = jasmine.createSpyObj('control', ['$setValidity']);
                element = jasmine.createSpyObj('element', ['on', 'trigger']);
                mockFileInputService = jasmine.createSpyObj('fileInputService',
                    ['getInput']
                );
                mockScope = jasmine.createSpyObj(
                        '$scope',
                        ['$watch']
                );

                mockScope.structure = {text: 'Select File'};
                mockScope.field = "file-input";
                mockScope.ngModel = {"file-input" : undefined};

                element.on.andCallFake(function (event, clickHandler) {
                    clickHandler();
                });
                mockFileInputService.getInput.andReturn(
                    Promise.resolve({name: "file-name", body: "file-body"})
                );

                mctFileInput = new MCTFileInput(mockFileInputService);

                // Need to wait for mock promise
                var init = false;
                runs(function () {
                    mctFileInput.link(mockScope, element, attrs, control);
                    setTimeout(function () {
                        init = true;
                    }, 100);
                });

                waitsFor(function () {
                    return init;
                }, "File selection should have beeen simulated");
            });

            it("is restricted to attributes", function () {
                expect(mctFileInput.restrict).toEqual("A");
            });

            it("changes button text to match file name", function () {
                expect(element.on).toHaveBeenCalledWith(
                    'click',
                    jasmine.any(Function)
                );
                expect(mockScope.structure.text).toEqual("file-name");
            });

            it("validates control on file selection", function () {
                expect(control.$setValidity.callCount).toBe(2);
                expect(control.$setValidity.argsForCall[0]).toEqual(
                    ['file-input', false]
                );
                expect(control.$setValidity.argsForCall[1]).toEqual(
                    ['file-input', true]
                );
            });
        });
    }
);
