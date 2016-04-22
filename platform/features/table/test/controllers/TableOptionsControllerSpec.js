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
/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,xit*/

define(
    [
        "../../src/controllers/TableOptionsController"
    ],
    function (TableOptionsController) {
        "use strict";

        describe('The Table Options Controller', function() {
            var mockDomainObject,
                mockCapability,
                controller,
                mockScope;

            function promise(value) {
                return {
                    then: function (callback){
                        return promise(callback(value));
                    }
                };
            }

            beforeEach(function() {
                mockCapability = jasmine.createSpyObj('mutationCapability', [
                    'listen'
                ]);
                mockDomainObject = jasmine.createSpyObj('domainObject', [
                   'getCapability',
                   'getModel'
                ]);
                mockDomainObject.getCapability.andReturn(mockCapability);
                mockDomainObject.getModel.andReturn({});

                mockScope = jasmine.createSpyObj('scope', [
                    '$watchCollection',
                    '$watch',
                    '$on'
                ]);
                mockScope.domainObject = mockDomainObject;

                controller = new TableOptionsController(mockScope);
            });

            it('Listens for changing domain object', function() {
                expect(mockScope.$watch).toHaveBeenCalledWith('domainObject', jasmine.any(Function));
            });

            it('On destruction of controller, destroys listeners', function() {
                var unlistenFunc = jasmine.createSpy("unlisten");
                controller.listeners.push(unlistenFunc);
                expect(mockScope.$on).toHaveBeenCalledWith('$destroy', jasmine.any(Function));
                mockScope.$on.mostRecentCall.args[1]();
                expect(unlistenFunc).toHaveBeenCalled();
            });

            it('Registers a listener for mutation events on the object', function() {
                mockScope.$watch.mostRecentCall.args[1](mockDomainObject);
                expect(mockCapability.listen).toHaveBeenCalled();
            });

            it('Listens for changes to object composition and updates' +
                ' options accordingly', function() {
                expect(mockScope.$watchCollection).toHaveBeenCalledWith('configuration.table.columns', jasmine.any(Function));
            });

            describe('Populates scope with a form definition based on provided' +
                ' column configuration', function() {
                var mockModel;

                beforeEach(function() {
                    mockModel = {
                        configuration: {
                            table: {
                                columns: {
                                    'column1': true,
                                    'column2': true,
                                    'column3': false,
                                    'column4': true,
                                }
                            }
                        }
                    };
                    controller.populateForm(mockModel);
                });

                it('creates form on scope', function() {
                    expect(mockScope.columnsForm).toBeDefined();
                    expect(mockScope.columnsForm.sections[0]).toBeDefined();
                    expect(mockScope.columnsForm.sections[0].rows).toBeDefined();
                    expect(mockScope.columnsForm.sections[0].rows.length).toBe(4);
                });

                it('presents columns as checkboxes', function() {
                    expect(mockScope.columnsForm.sections[0].rows.every(function(row){
                        return row.control === 'checkbox';
                    })).toBe(true);
                });
            });
        });

    });