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

define(
    [
        "../../src/controllers/RealtimeTableController"
    ],
    (TableController) => {

        describe('The real-time table controller', () => {
            let mockScope,
                mockTelemetryHandler,
                mockTelemetryHandle,
                mockTelemetryFormatter,
                mockDomainObject,
                mockTable,
                mockConfiguration,
                watches,
                mockTableRow,
                mockConductor,
                controller;

            const promise = (value) => {
                return {
                    then: (callback) => {
                        return promise(callback(value));
                    }
                };
            }

            beforeEach(() => {
                watches = {};
                mockTableRow = {'col1': 'val1', 'col2': 'row2'};

                mockScope = jasmine.createSpyObj('scope', [
                    '$on',
                    '$watch',
                    '$watchCollection',
                    '$digest',
                    '$broadcast'
                ]);
                mockScope.$on.andCallFake( (expression, callback) => {
                    watches[expression] = callback;
                });
                mockScope.$watch.andCallFake( (expression, callback) => {
                    watches[expression] = callback;
                });
                mockScope.$watchCollection.andCallFake( (expression, callback) => {
                    watches[expression] = callback;
                });

                mockConfiguration = {
                    'range1': true,
                    'range2': true,
                    'domain1': true
                };

                mockTable = jasmine.createSpyObj('table',
                    [
                        'populateColumns',
                        'buildColumnConfiguration',
                        'getRowValues',
                        'saveColumnConfiguration'
                    ]
                );
                mockTable.columns = [];
                mockTable.buildColumnConfiguration.andReturn(mockConfiguration);
                mockTable.getRowValues.andReturn(mockTableRow);

                mockDomainObject = jasmine.createSpyObj('domainObject', [
                    'getCapability',
                    'useCapability',
                    'getModel'
                ]);
                mockDomainObject.getModel.andReturn({});
                mockDomainObject.getCapability.andReturn(
                    {
                        getMetadata: () => {
                            return {ranges: [{format: 'string'}]};
                        }
                    });

                mockScope.domainObject = mockDomainObject;

                mockTelemetryHandle = jasmine.createSpyObj('telemetryHandle', [
                    'getMetadata',
                    'unsubscribe',
                    'getDatum',
                    'promiseTelemetryObjects',
                    'getTelemetryObjects',
                    'request',
                    'getMetadata'
                ]);

                // Arbitrary array with non-zero length, contents are not
                // used by mocks
                mockTelemetryHandle.getTelemetryObjects.andReturn([{}]);
                mockTelemetryHandle.promiseTelemetryObjects.andReturn(promise(undefined));
                mockTelemetryHandle.getDatum.andReturn({});
                mockTelemetryHandle.request.andReturn(promise(undefined));
                mockTelemetryHandle.getMetadata.andReturn([]);

                mockTelemetryHandler = jasmine.createSpyObj('telemetryHandler', [
                    'handle'
                ]);
                mockTelemetryHandler.handle.andReturn(mockTelemetryHandle);

                mockConductor = jasmine.createSpyObj('conductor', [
                    'on',
                    'off',
                    'bounds',
                    'timeSystem',
                    'timeOfInterest'
                ]);

                controller = new TableController(mockScope, mockTelemetryHandler, mockTelemetryFormatter, {conductor: mockConductor});
                controller.table = mockTable;
                controller.handle = mockTelemetryHandle;
            });

            it('registers for streaming telemetry', () => {
                controller.subscribe();
                expect(mockTelemetryHandler.handle).toHaveBeenCalledWith(jasmine.any(Object), jasmine.any(Function), true);
            });

            describe('receives new telemetry', () => {
                beforeEach(() => {
                    controller.subscribe();
                    mockScope.rows = [];
                });

                it('updates table with new streaming telemetry', () => {
                    mockTelemetryHandler.handle.mostRecentCall.args[1]();
                    expect(mockScope.$broadcast).toHaveBeenCalledWith('add:row', 0);
                });
                it('observes the row limit', () => {
                    let i = 0;
                    controller.maxRows = 10;

                    //Fill rows array with elements
                    for (; i < 10; i++) {
                        mockScope.rows.push({row: i});
                    }
                    mockTelemetryHandler.handle.mostRecentCall.args[1]();
                    expect(mockScope.rows.length).toBe(controller.maxRows);
                    expect(mockScope.rows[mockScope.rows.length - 1]).toBe(mockTableRow);
                    expect(mockScope.rows[0].row).toBe(1);
                });
            });
        });
    }
);
