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
/*global define,describe,it,xit,expect,beforeEach*/

define(
    ["../../src/actions/PropertiesDialog"],
    function (PropertiesDialog) {
        "use strict";

        describe("Properties dialog", function () {

            var type, properties, domainObject, model, dialog;

            beforeEach(function () {
                type = {
                    getProperties: function () { return properties; }
                };
                model = { x: "initial value" };
                properties = ["x", "y", "z"].map(function (k) {
                    return {
                        getValue: function (model) { return model[k]; },
                        setValue: function (model, v) { model[k] = v; },
                        getDefinition: function () { return { control: 'textfield '}; }
                    };
                });

                dialog = new PropertiesDialog(type, model);
            });

            it("provides sections based on type properties", function () {
                expect(dialog.getFormStructure().sections[0].rows.length)
                    .toEqual(properties.length);
            });

            it("pulls initial values from object model", function () {
                expect(dialog.getInitialFormValue()[0])
                    .toEqual("initial value");
            });

            it("populates models with form results", function () {
                dialog.updateModel(model, [
                    "new value",
                    "other new value",
                    42
                ]);
                expect(model).toEqual({
                    x: "new value",
                    y: "other new value",
                    z: 42
                });
            });

        });
    }
);
