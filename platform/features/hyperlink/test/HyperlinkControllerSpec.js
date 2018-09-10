/*****************************************************************************
 * Open MCT, Copyright (c) 2009-2016, United States Government
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
    ["../src/HyperlinkController"],
    function (HyperlinkController) {

        describe("The controller for hyperlinks", function () {
            var domainObject,
                controller,
                scope;
            beforeEach(function () {
                scope = jasmine.createSpyObj(
                    "$scope",
                    ["domainObject"]
                );
                domainObject = jasmine.createSpyObj(
                    "domainObject",
                    ["getModel"]
                );
                scope.domainObject = domainObject;
                controller = new HyperlinkController(scope);
            });
            it("knows when it should open a new tab", function () {
                scope.domainObject.getModel.and.returnValue({
                    "displayFormat": "link",
                    "openNewTab": "newTab",
                    "showTitle": false
                }
                );
                controller = new HyperlinkController(scope);
                expect(controller.openNewTab())
                    .toBe(true);
            });
            it("knows when it is a button", function () {
                scope.domainObject.getModel.and.returnValue({
                    "displayFormat": "button",
                    "openNewTab": "thisTab",
                    "showTitle": false
                }
                );
                controller = new HyperlinkController(scope);
                expect(controller.isButton())
                    .toEqual(true);
            });
            it("knows when it should open in the same tab", function () {
                scope.domainObject.getModel.and.returnValue({
                    "displayFormat": "link",
                    "openNewTab": "thisTab",
                    "showTitle": false
                }
                );
                controller = new HyperlinkController(scope);
                expect(controller.openNewTab())
                    .toBe(false);
            });
            it("knows when it is a link", function () {
                scope.domainObject.getModel.and.returnValue({
                    "displayFormat": "link",
                    "openNewTab": "thisTab",
                    "showTitle": false
                }
                );
                controller = new HyperlinkController(scope);
                expect(controller.openNewTab())
                    .toBe(false);
            });
        });
    }
);
