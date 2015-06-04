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
    ['../../src/elements/ElementFactory'],
    function (ElementFactory) {
        "use strict";

        var DIALOG_ELEMENTS = [ 'image', 'text' ],
            NON_DIALOG_ELEMENTS = [ 'box', 'line' ];

        describe("The fixed position element factory", function () {
            var mockDialogService,
                mockPromise,
                factory;

            beforeEach(function () {
                mockDialogService = jasmine.createSpyObj(
                    'dialogService',
                    [ 'getUserInput' ]
                );
                mockPromise = jasmine.createSpyObj(
                    'promise',
                    [ 'then' ]
                );

                mockDialogService.getUserInput.andReturn(mockPromise);
                mockPromise.then.andReturn(mockPromise);

                factory = new ElementFactory(mockDialogService);
            });

            DIALOG_ELEMENTS.forEach(function (type) {
                it("shows a dialog for " + type + " elements", function () {
                    expect(factory.createElement('fixed.' + type))
                        .toEqual(mockPromise);
                    expect(mockDialogService.getUserInput).toHaveBeenCalled();
                });
            });

            NON_DIALOG_ELEMENTS.forEach(function (type) {
                it("immediately provides " + type + " elements", function () {
                    var result = factory.createElement('fixed.' + type);
                    expect(result).toBeDefined();
                    expect(result).not.toEqual(mockPromise);
                    expect(mockDialogService.getUserInput).not.toHaveBeenCalled();
                });
            });
        });
    }
);