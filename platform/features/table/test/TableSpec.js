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
        "../src/Table",
        "../src/DomainColumn"
    ],
    function (Table, DomainColumn) {
        "use strict";

        describe("A table", function () {
            var mockDomainObject,
                mockTelemetryFormatter,
                table,
                mockModel;

            beforeEach(function () {
                mockDomainObject = jasmine.createSpyObj('domainObject',
                    ['getModel', 'useCapability', 'getCapability']
                );
                mockModel = {};
                mockDomainObject.getModel.andReturn(mockModel);
                mockTelemetryFormatter = jasmine.createSpyObj('telemetryFormatter',
                    [
                        'formatDomainValue',
                        'formatRangeValue'
                    ]);
                mockTelemetryFormatter.formatDomainValue.andCallFake(function(valueIn){
                    return valueIn;
                });
                mockTelemetryFormatter.formatRangeValue.andCallFake(function(valueIn){
                    return valueIn;
                });

                table = new Table(mockDomainObject, mockTelemetryFormatter);
            });

            it("Add column with no index adds new column to the end", function () {
                var firstColumn = {title: 'First Column'},
                    secondColumn = {title: 'Second Column'},
                    thirdColumn = {title: 'Third Column'};

                table.addColumn(firstColumn);
                table.addColumn(secondColumn);
                table.addColumn(thirdColumn);

                expect(table.columns).toBeDefined();
                expect(table.columns.length).toBe(3);
                expect(table.columns[0]).toBe(firstColumn);
                expect(table.columns[1]).toBe(secondColumn);
                expect(table.columns[2]).toBe(thirdColumn);
            });

            it("Add column with index adds new column at the specified" +
                " position", function () {
                var firstColumn = {title: 'First Column'},
                    secondColumn = {title: 'Second Column'},
                    thirdColumn = {title: 'Third Column'};

                table.addColumn(firstColumn);
                table.addColumn(thirdColumn);
                table.addColumn(secondColumn, 1);

                expect(table.columns).toBeDefined();
                expect(table.columns.length).toBe(3);
                expect(table.columns[0]).toBe(firstColumn);
                expect(table.columns[1]).toBe(secondColumn);
                expect(table.columns[2]).toBe(thirdColumn);
            });

            describe("Building columns from telemetry metadata", function() {
                var metadata = [{
                    ranges: [
                        {
                            name: 'Range 1',
                            key: 'range1'
                        },
                        {
                            name: 'Range 2',
                            key: 'range2'
                        }
                    ],
                    domains: [
                        {
                            name: 'Domain 1',
                            key: 'domain1',
                            format: 'utc'
                        },
                        {
                            name: 'Domain 2',
                            key: 'domain2',
                            format: 'utc'
                        }
                    ]
                }];

                beforeEach(function() {
                    table.buildColumns(metadata);
                });

                it("populates the columns attribute", function() {
                    expect(table.columns.length).toBe(4);
                });

                it("Build columns populates columns with domains to the left", function() {
                    expect(table.columns[0] instanceof DomainColumn).toBeTruthy();
                    expect(table.columns[1] instanceof DomainColumn).toBeTruthy();
                    expect(table.columns[2] instanceof DomainColumn).toBeFalsy();
                });

                it("Produces headers for each column based on title", function() {
                    var headers,
                        firstColumn = table.columns[0];

                    spyOn(firstColumn, 'getTitle');
                    headers = table.getHeaders();
                    expect(headers.length).toBe(4);
                    expect(firstColumn.getTitle).toHaveBeenCalled();
                });

                it("Provides a default configuration with all columns" +
                    " visible", function() {
                    var configuration = table.getColumnConfiguration();

                    expect(configuration).toBeDefined();
                    expect(Object.keys(configuration).every(function(key){
                        return configuration[key];
                    }));
                });

                it("Column configuration exposes persisted configuration", function() {
                    var tableConfig,
                        modelConfig = {
                        table: {
                            columns : {
                                'Range 1': false
                            }
                        }
                    };
                    mockModel.configuration = modelConfig;

                    tableConfig = table.getColumnConfiguration();

                    expect(tableConfig).toBeDefined();
                    expect(tableConfig['Range 1']).toBe(false);
                });

                describe('retrieving row values', function () {
                    var datum,
                        rowValues;

                    beforeEach(function() {
                        datum = {
                            'range1': 'range 1 value',
                            'range2': 'range 2 value',
                            'domain1': 0,
                            'domain2': 1
                        };
                        rowValues = table.getRowValues(mockDomainObject, datum);
                    });

                    it("Returns a value for every column", function() {
                        expect(rowValues['Range 1'].text).toBeDefined();
                        expect(rowValues['Range 1'].text).toEqual('range 1' +
                            ' value');
                    });

                    it("Uses the telemetry formatter to appropriately format" +
                        " telemetry values", function() {
                        expect(mockTelemetryFormatter.formatRangeValue).toHaveBeenCalled();
                    });
                });
            });
        });
    }
);
