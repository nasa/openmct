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
        "../../src/controllers/RTTelemetryTableController"
    ],
    function (TableController) {
        "use strict";

        describe('The real-time table controller', function () {
            var mockScope,
                mockTelemetryHandler,
                mockTelemetryHandle,
                mockTelemetryFormatter,
                mockDomainObject,
                mockTable,
                mockConfiguration,
                watches,
                mockTableRow,
                controller;

            function promise(value) {
                return {
                    then: function (callback){
                        return promise(callback(value));
                    }
                };
            }

            beforeEach(function () {
                watches = {};
                mockTableRow = {'col1': 'val1', 'col2': 'row2'};

                mockScope = jasmine.createSpyObj('scope', [
                    '$on',
                    '$watch',
                    '$watchCollection',
                    '$digest',
                    '$broadcast'
                ]);
                mockScope.$on.andCallFake(function (expression, callback){
                    watches[expression] = callback;
                });
                mockScope.$watch.andCallFake(function (expression, callback){
                   watches[expression] = callback;
                });
                mockScope.$watchCollection.andCallFake(function (expression, callback){
                    watches[expression] = callback;
                });

                mockConfiguration = {
                    'range1': true,
                    'range2': true,
                    'domain1': true
                };

                mockTable = jasmine.createSpyObj('table',
                    [
                        'buildColumns',
                        'getColumnConfiguration',
                        'getRowValues',
                        'saveColumnConfiguration'
                    ]
                );
                mockTable.columns = [];
                mockTable.getColumnConfiguration.andReturn(mockConfiguration);
                mockTable.getRowValues.andReturn(mockTableRow);

                mockDomainObject= jasmine.createSpyObj('domainObject', [
                    'getCapability',
                    'useCapability',
                    'getModel'
                ]);
                mockDomainObject.getModel.andReturn({});
                mockDomainObject.getCapability.andReturn(
                    {
                        getMetadata: function (){
                            return {ranges: [{format: 'string'}]};
                        }
                    });

                mockScope.domainObject = mockDomainObject;

                mockTelemetryHandle = jasmine.createSpyObj('telemetryHandle', [
                    'getMetadata',
                    'unsubscribe',
                    'getDatum',
                    'promiseTelemetryObjects',
                    'getTelemetryObjects'
                ]);
                // Arbitrary array with non-zero length, contents are not
                // used by mocks
                mockTelemetryHandle.getTelemetryObjects.andReturn([{}]);
                mockTelemetryHandle.promiseTelemetryObjects.andReturn(promise(undefined));
                mockTelemetryHandle.getDatum.andReturn({});

                mockTelemetryHandler = jasmine.createSpyObj('telemetryHandler', [
                    'handle'
                ]);
                mockTelemetryHandler.handle.andReturn(mockTelemetryHandle);

                controller = new TableController(mockScope, mockTelemetryHandler, mockTelemetryFormatter);
                controller.table = mockTable;
                controller.handle = mockTelemetryHandle;
            });

            it('registers for streaming telemetry', function () {
                controller.subscribe();
                expect(mockTelemetryHandler.handle).toHaveBeenCalledWith(jasmine.any(Object), jasmine.any(Function), true);
            });

            describe('receives new telemetry', function () {
                beforeEach(function() {
                    controller.subscribe();
                    mockScope.rows = [];
                });

                it('updates table with new streaming telemetry', function () {
                    mockTelemetryHandler.handle.mostRecentCall.args[1]();
                    expect(mockScope.$broadcast).toHaveBeenCalledWith('add:row', 0);
                });
                it('observes the row limit', function () {
                    var i = 0;
                    controller.maxRows = 10;

                    //Fill rows array with elements
                    for (; i < 10; i++) {
                        mockScope.rows.push({row: i});
                    }
                    mockTelemetryHandler.handle.mostRecentCall.args[1]();
                    expect(mockScope.rows.length).toBe(controller.maxRows);
                    expect(mockScope.rows[mockScope.rows.length-1]).toBe(mockTableRow);
                    expect(mockScope.rows[0].row).toBe(1);
                });
            });

            it('enables autoscroll for event telemetry', function () {
                controller.subscribe();
                mockScope.$watch.mostRecentCall.args[1](mockDomainObject);
                expect(mockScope.autoScroll).toBe(true);
            });

        });
    }
);
