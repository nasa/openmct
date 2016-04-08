/*****************************************************************************
 * Open MCT Web, Copyright (c) 2009-2015, United States Government
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
/*global define,describe,it,expect,beforeEach,waitsFor,jasmine,window,afterEach*/

define(
    ['../../src/actions/TimelineColumnizer'],
    function (TimelineColumnizer) {
        describe("TimelineColumnizer", function () {
            var mockDomainObjects,
                testMetadata,
                exporter;

            function makeMockDomainObject(model, index) {
                var mockDomainObject = jasmine.createSpyObj(
                    'domainObject-' + index,
                    [
                        'getId',
                        'getCapability',
                        'useCapability',
                        'hasCapability',
                        'getModel'
                    ]
                );
                mockDomainObject.getId.andReturn('id-' + index);
                mockDomainObject.getModel.andReturn(model);
                mockDomainObject.useCapability.andCallFake(function (c) {
                    return c === 'metadata' && [];
                });
                return mockDomainObject;
            }

            beforeEach(function () {
                var mockTimespan = jasmine.createSpyObj(
                    'timespan',
                    [ 'getStart', 'getEnd' ]
                );

                testMetadata = [
                    { name: "abc", value: 123 },
                    { name: "xyz", value: 456 }
                ];

                mockDomainObjects = [
                    { composition: [ 'a', 'b', 'c' ] },
                    { relationships: { modes: [ 'x', 'y' ] } },
                    { }
                ].map(makeMockDomainObject);

                mockDomainObjects[1].hasCapability.andCallFake(function (c) {
                    return c === 'timespan';
                });
                mockDomainObjects[1].useCapability.andCallFake(function (c) {
                    return c === 'timespan' ? Promise.resolve(mockTimespan) :
                        c === 'metadata' ? [] : undefined;
                });
                mockDomainObjects[2].useCapability.andCallFake(function (c) {
                    return c === 'metadata' && testMetadata;
                });

                exporter = new TimelineColumnizer(mockDomainObjects);
            });

            describe("rows", function () {
                var rows;

                beforeEach(function () {
                    exporter.rows().then(function (r) {
                        rows = r;
                    });
                    waitsFor(function () {
                        return rows !== undefined;
                    });
                });


                it("include one row per domain object", function () {
                    expect(rows.length).toEqual(mockDomainObjects.length);
                });

                it("includes identifiers for each domain object", function () {
                    rows.forEach(function (row, index) {
                        var id = mockDomainObjects[index].getId();
                        expect(row.indexOf(id)).not.toEqual(-1);
                    });
                });
            });

            describe("headers", function () {
                var headers;

                beforeEach(function () {
                    headers = exporter.headers();
                });

                it("contains all metadata properties", function () {
                    testMetadata.forEach(function (property) {
                        expect(headers.indexOf(property.name))
                            .not.toEqual(-1);
                    });
                });

                it("contains timespan properties", function () {
                    expect(headers.indexOf("Start")).not.toEqual(-1);
                    expect(headers.indexOf("End")).not.toEqual(-1);
                });
            });

        });
    }
);
