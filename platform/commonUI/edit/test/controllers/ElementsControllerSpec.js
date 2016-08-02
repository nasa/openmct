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
/*global describe,it,expect,beforeEach,jasmine*/

define(
    ["../../src/controllers/ElementsController"],
    function (ElementsController) {

        describe("The Elements Pane controller", function () {
            var mockScope,
                controller;

            beforeEach(function () {
                mockScope = jasmine.createSpy("$scope");
                controller = new ElementsController(mockScope);
            });

            function getModel(model) {
                return function () {
                    return model;
                };
            }

            it("filters objects in elements pool based on input text and" +
                " object name", function () {
                var objects = [
                    {
                        getModel: getModel({name: "first element"})
                    },
                    {
                        getModel: getModel({name: "second element"})
                    },
                    {
                        getModel: getModel({name: "third element"})
                    },
                    {
                        getModel: getModel({name: "THIRD Element 1"})
                    }
                ];

                mockScope.filterBy("third element");
                expect(objects.filter(mockScope.searchElements).length).toBe(2);
                mockScope.filterBy("element");
                expect(objects.filter(mockScope.searchElements).length).toBe(4);
            });

        });
    }
);
