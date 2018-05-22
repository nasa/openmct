/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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
        "../src/TableConfiguration"
    ],
    function (Table) {

        describe("A table", function () {
            var mockDomainObject,
                mockAPI,
                mockTelemetryAPI,
                table,
                mockModel;

            beforeEach(function () {
                mockDomainObject = jasmine.createSpyObj('domainObject',
                    ['getModel', 'useCapability', 'getCapability', 'hasCapability']
                );
                mockModel = {};
                mockDomainObject.getModel.andReturn(mockModel);
                mockDomainObject.getCapability.andCallFake(function (name) {
                    return name === 'editor' && {
                        isEditContextRoot: function () {
                            return true;
                        }
                    };
                });

                mockTelemetryAPI = jasmine.createSpyObj('telemetryAPI', [
                    'getValueFormatter'
                ]);
                mockAPI = {
                    telemetry: mockTelemetryAPI
                };
                mockTelemetryAPI.getValueFormatter.andCallFake(function (metadata) {
                    var formatter = jasmine.createSpyObj(
                        'telemetryFormatter:' + metadata.key,
                        [
                            'format',
                            'parse'
                        ]
                    );
                    var getter = function (datum) {
                        return datum[metadata.key];
                    };
                    formatter.format.andCallFake(getter);
                    formatter.parse.andCallFake(getter);
                    return formatter;
                });

                table = new Table(mockDomainObject, mockAPI);
            });

            describe("Building columns from telemetry metadata", function () {
                var metadata = [
                    {
                        name: 'Range 1',
                        key: 'range1',
                        hints: {
                            y: 1
                        }
                    },
                    {
                        name: 'Range 2',
                        key: 'range2',
                        hints: {
                            y: 2
                        }
                    },
                    {
                        name: 'Domain 1',
                        key: 'domain1',
                        format: 'utc',
                        hints: {
                            x: 1
                        }
                    },
                    {
                        name: 'Domain 2',
                        key: 'domain2',
                        format: 'utc',
                        hints: {
                            x: 2
                        }
                    }
                ];

                beforeEach(function () {
                    table.populateColumns(metadata);
                });

                it("populates columns", function () {
                    expect(table.columns.length).toBe(4);
                });

                it("Produces headers for each column based on title", function () {
                    var headers,
                        firstColumn = table.columns[0];

                    spyOn(firstColumn, 'getTitle');
                    headers = table.getHeaders();
                    expect(headers.length).toBe(4);
                    expect(firstColumn.getTitle).toHaveBeenCalled();
                });

                it("Provides a default configuration with all columns" +
                    " visible", function () {
                    var configuration = table.buildColumnConfiguration();

                    expect(configuration).toBeDefined();
                    expect(Object.keys(configuration).every(function (key) {
                        return configuration[key];
                    }));
                });

                it("Column configuration exposes persisted configuration", function () {
                    var tableConfig,
                        modelConfig = {
                        table: {
                            columns : {
                                'Range 1': false
                            }
                        }
                    };
                    mockModel.configuration = modelConfig;

                    tableConfig = table.buildColumnConfiguration();

                    expect(tableConfig).toBeDefined();
                    expect(tableConfig['Range 1']).toBe(false);
                });

                describe('retrieving row values', function () {
                    var datum,
                        rowValues;

                    beforeEach(function () {
                        datum = {
                            'range1': 10,
                            'range2': 20,
                            'domain1': 0,
                            'domain2': 1
                        };
                        var limitEvaluator = {
                            evaluate: function () {
                                return {
                                    "cssClass": "alarm-class"
                                };
                            }
                        };
                        rowValues = table.getRowValues(limitEvaluator, datum);
                    });

                    it("Returns a value for every column", function () {
                        expect(rowValues['Range 1'].text).toBeDefined();
                        expect(rowValues['Range 1'].text).toEqual(10);
                    });

                    it("Applies appropriate css class if limit violated.", function () {
                        expect(rowValues['Range 1'].cssClass).toEqual("alarm-class");
                    });

                });
            });
        });
    }
);
