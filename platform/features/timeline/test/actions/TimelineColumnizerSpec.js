/*****************************************************************************
 * Open MCT, Copyright (c) 2009-2016, United States Government
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
    ['../../src/actions/TimelineColumnizer'],
    (TimelineColumnizer) => {
        describe("TimelineColumnizer", () => {
            let mockDomainObjects,
                testMetadata,
                exporter;

            const makeMockDomainObject = (model, index) => {
                let mockDomainObject = jasmine.createSpyObj(
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
                mockDomainObject.useCapability.andCallFake( (c) => {
                    return c === 'metadata' && [];
                });
                return mockDomainObject;
            }

            beforeEach(() => {
                let mockTimespan = jasmine.createSpyObj(
                    'timespan',
                    ['getStart', 'getEnd']
                );

                testMetadata = [
                    { name: "abc", value: 123 },
                    { name: "xyz", value: 456 }
                ];

                mockDomainObjects = [
                    { composition: ['a', 'b', 'c'] },
                    { relationships: { modes: ['x', 'y'] } },
                    { }
                ].map(makeMockDomainObject);

                mockDomainObjects[1].hasCapability.andCallFake( (c) => {
                    return c === 'timespan';
                });
                mockDomainObjects[1].useCapability.andCallFake( (c) => {
                    return c === 'timespan' ? Promise.resolve(mockTimespan) :
                        c === 'metadata' ? [] : undefined;
                });
                mockDomainObjects[2].useCapability.andCallFake( (c) => {
                    return c === 'metadata' && testMetadata;
                });

                exporter = new TimelineColumnizer(mockDomainObjects, []);
            });

            describe("rows", () => {
                let rows;

                beforeEach(() => {
                    exporter.rows().then( (r) => {
                        rows = r;
                    });
                    waitsFor(() => {
                        return rows !== undefined;
                    });
                });


                it("include one row per domain object", () => {
                    expect(rows.length).toEqual(mockDomainObjects.length);
                });
            });

            describe("headers", () => {
                let headers;

                beforeEach(() => {
                    headers = exporter.headers();
                });

                it("contains all metadata properties", () => {
                    testMetadata.forEach( (property) => {
                        expect(headers.indexOf(property.name))
                            .not.toEqual(-1);
                    });
                });

                it("contains timespan properties", () => {
                    expect(headers.indexOf("Start")).not.toEqual(-1);
                    expect(headers.indexOf("End")).not.toEqual(-1);
                });
            });

        });
    }
);
