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
        "../../src/controllers/TelemetryTableController"
    ],
    function (TableController) {
        "use strict";

        describe('The Table Controller', function () {
            var mockScope,
                mockTelemetryHandler,
                mockTelemetryHandle,
                mockTelemetryFormatter,
                mockTelemetryCapability,
                mockDomainObject,
                mockChild,
                mockMutationCapability,
                mockCompositionCapability,
                childMutationCapability,
                capabilities = {},
                mockTable,
                mockConfiguration,
                watches,
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
                mockScope = jasmine.createSpyObj('scope', [
                    '$on',
                    '$watch',
                    '$watchCollection'
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
                mockTelemetryCapability = jasmine.createSpyObj('telemetryCapability',
                    ['getMetadata']
                );
                mockTelemetryCapability.getMetadata.andReturn({});
                capabilities.telemetry = mockTelemetryCapability;

                mockCompositionCapability = jasmine.createSpyObj('compositionCapability',
                    ['invoke']
                );
                mockCompositionCapability.invoke.andReturn(promise([]));
                capabilities.composition = mockCompositionCapability;

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
                mockMutationCapability = jasmine.createSpyObj('mutationCapability', [
                    "listen"
                ]);
                capabilities.mutation = mockMutationCapability;

                mockDomainObject = jasmine.createSpyObj('domainObject', [
                    'getCapability',
                    'hasCapability',
                    'useCapability',
                    'getModel'
                ]);
                mockChild = jasmine.createSpyObj('domainObject', [
                    'getCapability'
                ]);
                childMutationCapability = jasmine.createSpyObj('childMutationCapability', [
                    "listen"
                ]);
                mockChild.getCapability.andReturn(childMutationCapability);


                mockDomainObject.getModel.andReturn({});
                mockDomainObject.hasCapability.andCallFake(function (name){
                    return typeof capabilities[name] !== 'undefined';
                });
                mockDomainObject.useCapability.andCallFake(function (capability){
                    return capabilities[capability] && capabilities[capability].invoke && capabilities[capability].invoke();
                });
                mockDomainObject.getCapability.andCallFake(function (name){
                    return capabilities[name];
                });

                mockScope.domainObject = mockDomainObject;

                mockTelemetryHandle = jasmine.createSpyObj('telemetryHandle', [
                    'request',
                    'promiseTelemetryObjects',
                    'getTelemetryObjects',
                    'getMetadata',
                    'getSeries',
                    'unsubscribe',
                    'makeDatum'
                ]);
                mockTelemetryHandle.promiseTelemetryObjects.andReturn(promise(undefined));
                mockTelemetryHandle.request.andReturn(promise(undefined));
                mockTelemetryHandle.getTelemetryObjects.andReturn([]);
                mockTelemetryHandle.getMetadata.andReturn(["a", "b", "c"]);

                mockTelemetryHandler = jasmine.createSpyObj('telemetryHandler', [
                    'handle'
                ]);
                mockTelemetryHandler.handle.andReturn(mockTelemetryHandle);

                controller = new TableController(mockScope, mockTelemetryHandler, mockTelemetryFormatter);
                controller.table = mockTable;
                controller.handle = mockTelemetryHandle;
            });

            it('subscribes to telemetry handler for telemetry updates', function () {
                controller.subscribe();
                expect(mockTelemetryHandler.handle).toHaveBeenCalled();
                expect(mockTelemetryHandle.request).toHaveBeenCalled();
            });

            it('Unsubscribes from telemetry when scope is destroyed',function () {
                controller.handle = mockTelemetryHandle;
                watches.$destroy();
                expect(mockTelemetryHandle.unsubscribe).toHaveBeenCalled();
            });

            describe('the controller makes use of the table', function () {
                it('to create column definitions from telemetry' +
                    ' metadata', function () {
                    controller.setup();
                    expect(mockTable.buildColumns).toHaveBeenCalled();
                });

                it('to create column configuration, which is written to the' +
                    ' object model', function () {
                    var mockModel = {};

                    controller.setup();
                    expect(mockTable.getColumnConfiguration).toHaveBeenCalled();
                    expect(mockTable.saveColumnConfiguration).toHaveBeenCalled();
                });
            });

            it('updates the rows on scope when historical telemetry is received', function (){
                var mockSeries = {
                        getPointCount: function () {
                            return 5;
                        },
                        getDomainValue: function () {
                            return 'Domain Value';
                        },
                        getRangeValue: function () {
                            return 'Range Value';
                        }
                    },
                    mockRow = {'domain': 'Domain Value', 'range': 'Range' +
                    ' Value'};

                mockTelemetryHandle.makeDatum.andCallFake(function (){
                    return mockRow;
                });
                mockTable.getRowValues.andReturn(mockRow);
                mockTelemetryHandle.getTelemetryObjects.andReturn([mockDomainObject]);
                mockTelemetryHandle.getSeries.andReturn(mockSeries);

                controller.addHistoricalData(mockDomainObject, mockSeries);

                expect(controller.$scope.rows.length).toBe(5);
                expect(controller.$scope.rows[0]).toBe(mockRow);
            });

            it('filters the visible columns based on configuration', function (){
                controller.filterColumns();
                expect(controller.$scope.headers.length).toBe(3);
                expect(controller.$scope.headers[2]).toEqual('domain1');

                mockConfiguration.domain1 = false;
                controller.filterColumns();
                expect(controller.$scope.headers.length).toBe(2);
                expect(controller.$scope.headers[2]).toBeUndefined();
            });

            describe('creates event listeners', function (){
                beforeEach(function () {
                    spyOn(controller,'subscribe');
                    spyOn(controller, 'filterColumns');
                });

                it('triggers telemetry subscription update when domain' +
                    ' object changes', function () {
                    controller.registerChangeListeners();
                    //'watches' object is populated by fake scope watch and
                    // watchCollection functions defined above
                    expect(watches.domainObject).toBeDefined();
                    watches.domainObject(mockDomainObject);
                    expect(controller.subscribe).toHaveBeenCalled();
                });

                it('triggers telemetry subscription update when time' +
                    ' conductor bounds change', function () {
                    controller.registerChangeListeners();
                    expect(watches['telemetry:display:bounds']).toBeDefined();
                    watches['telemetry:display:bounds']();
                    expect(controller.subscribe).toHaveBeenCalled();
                });
                it('Listens for changes to object model', function () {
                    controller.registerChangeListeners();
                    expect(mockMutationCapability.listen).toHaveBeenCalled();
                });

                it('Listens for changes to child model', function () {
                    mockCompositionCapability.invoke.andReturn(promise([mockChild]));
                    controller.registerChangeListeners();
                    expect(childMutationCapability.listen).toHaveBeenCalled();
                });

                it('Recalculates columns when model changes occur', function () {
                    controller.registerChangeListeners();
                    expect(mockMutationCapability.listen).toHaveBeenCalled();
                    mockMutationCapability.listen.mostRecentCall.args[0]();
                    expect(controller.filterColumns).toHaveBeenCalled();
                });

            });
        });
    }
);
