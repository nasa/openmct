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
    ['../../src/actions/ModeColumn'],
    function (ModeColumn) {
        describe("ModeColumn", function () {
            var testIndex,
                column;

            beforeEach(function () {
                testIndex = 3;
                column = new ModeColumn(testIndex);
            });

            it("includes a one-based index in its name", function () {
                expect(column.name().indexOf(String(testIndex + 1)))
                    .not.toEqual(-1);
            });

            describe("value", function () {
                var mockDomainObject,
                    testModel;

                beforeEach(function () {
                    mockDomainObject = jasmine.createSpyObj(
                        'domainObject',
                        [ 'getId', 'getModel', 'getCapability' ]
                    );
                    testModel = {
                        relationships: {
                            modes: [ 'a', 'b', 'c', 'd', 'e', 'f' ]
                        }
                    };
                    mockDomainObject.getModel.andReturn(testModel);
                });

                it("returns a corresponding identifier", function () {
                    expect(column.value(mockDomainObject))
                        .toEqual(testModel.relationships.modes[testIndex]);
                });

                it("returns nothing when relationships are exceeded", function () {
                    testModel.relationships.modes = [ 'foo' ];
                    expect(column.value(mockDomainObject)).toEqual("");
                });

                it("returns nothing when mode relationships are absent", function () {
                    delete testModel.relationships.modes;
                    expect(column.value(mockDomainObject)).toEqual("");
                });
            });

        });
    }
);