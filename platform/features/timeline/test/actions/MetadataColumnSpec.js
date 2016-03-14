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
    ['../../src/actions/MetadataColumn'],
    function (MetadataColumn) {
        describe("MetadataColumn", function () {
            var testName,
                column;

            beforeEach(function () {
                testName = 'Foo';
                column = new MetadataColumn(testName);
            });

            it("reports its property name", function () {
                expect(column.name()).toEqual(testName);
            });

            describe("value", function () {
                var mockDomainObject,
                    testMetadata,
                    testIndex;

                beforeEach(function () {
                    mockDomainObject = jasmine.createSpyObj(
                        'domainObject',
                        [ 'getId', 'getModel', 'getCapability', 'useCapability' ]
                    );
                    testMetadata = [
                        { name: "Something else", value: 123 },
                        { value: 456 },
                        { name: "And something else", value: 789 }
                    ];
                    testIndex = 1;
                    testMetadata[testIndex].name = testName;

                    mockDomainObject.useCapability.andCallFake(function (c) {
                        return (c === 'metadata') && testMetadata;
                    });
                });

                it("returns a corresponding value", function () {
                    expect(column.value(mockDomainObject))
                        .toEqual(testMetadata[testIndex].value);
                });

                it("returns nothing when no such property is present", function () {
                    testMetadata[testIndex].name = "Not " + testName;
                    expect(column.value(mockDomainObject)).toEqual("");
                });
            });

        });
    }
);