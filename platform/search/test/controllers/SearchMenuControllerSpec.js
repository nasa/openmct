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

/**
 *  SearchSpec. Created by shale on 08/17/2015.
 */
define(
    ["../../src/controllers/SearchMenuController"],
    function (SearchMenuController) {
        "use strict";

        describe("The search menu controller", function () {
            var mockScope,
                mockPromise,
                mockTypes,
                controller;
            
            beforeEach(function () {
                mockScope = jasmine.createSpyObj(
                    "$scope",
                    [ "" ]
                );
                
                mockTypes = [
                    {key: 'mock.type.1', name: 'Mock Type 1', glyph: 'a'},
                    {key: 'mock.type.2', name: 'Mock Type 2', glyph: 'b'}
                ];
                
                mockScope.ngModel = {};
                mockScope.ngModel.checked = {};
                mockScope.ngModel.checked['mock.type.1'] = false;
                mockScope.ngModel.checked['mock.type.2'] = false;
                mockScope.ngModel.checkAll = true;
                mockScope.ngModel.filter = jasmine.createSpy('$scope.ngModel.filter');
                mockScope.ngModel.filtersString = '';
                
                controller = new SearchMenuController(mockScope, mockTypes);
            });
            
            it("gets types on initiliztion", function () {
                expect(mockScope.ngModel.types).toBeDefined();
            });
            
            it("refilters results when options are updated", function () {
                controller.updateOptions();
                expect(mockScope.ngModel.filter).toHaveBeenCalled();
                
                controller.checkAll();
                expect(mockScope.ngModel.filter).toHaveBeenCalled();
            });
            
            it("updates the filters string when options are updated", function () {
                controller.updateOptions();
                expect(mockScope.ngModel.filtersString).toEqual('');
                
                mockScope.ngModel.checked['mock.type.1'] = true;
                
                controller.updateOptions();
                expect(mockScope.ngModel.filtersString).not.toEqual('');
            });
            
            it("changing checkAll status updates the filter string", function () {
                controller.checkAll();
                expect(mockScope.ngModel.filtersString).toEqual('');
                
                mockScope.ngModel.checkAll = false;
                
                controller.checkAll();
                expect(mockScope.ngModel.filtersString).toEqual('NONE');
            });
            
            it("checking checkAll option resets other options", function () {
                var type;
                
                mockScope.ngModel.checked['mock.type.1'] = true;
                mockScope.ngModel.checked['mock.type.2'] = true;
                
                controller.checkAll();
                
                for (type in mockScope.ngModel.checked) {
                    expect(mockScope.ngModel.checked[type]).toBeFalsy();
                }
            });
            
            it("tells the user when no options are checked", function () {
                var type;
                
                for (type in mockScope.ngModel.checked) {
                    mockScope.ngModel.checked[type] = false;
                }
                mockScope.ngModel.checkAll = false;
                
                controller.updateOptions();
                
                expect(mockScope.ngModel.filtersString).toEqual('NONE');
            });
            
            it("tells the user when options are checked", function () {
                var type;
                
                mockScope.ngModel.checkAll = false;
                for (type in mockScope.ngModel.checked) {
                    mockScope.ngModel.checked[type] = true;
                }
                
                controller.updateOptions();
                
                expect(mockScope.ngModel.filtersString).not.toEqual('NONE');
                expect(mockScope.ngModel.filtersString).not.toEqual('');
            });
        });
    }
);