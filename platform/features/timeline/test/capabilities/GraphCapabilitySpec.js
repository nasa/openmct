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
    ['../../src/capabilities/GraphCapability'],
    function (GraphCapability) {
        'use strict';

        describe("A Timeline's graph capability", function () {
            var mockQ,
                mockDomainObject,
                testModel,
                capability;

            function asPromise(v) {
                return (v || {}).then ? v : {
                    then: function (cb) {
                        return asPromise(cb(v));
                    }
                };
            }

            beforeEach(function () {
                mockQ = jasmine.createSpyObj('$q', ['when']);
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    [ 'getId', 'getModel', 'useCapability' ]
                );

                testModel = {
                    type: "activity",
                    resources: {
                        abc: 100,
                        xyz: 42
                    }
                };

                mockQ.when.andCallFake(asPromise);
                mockDomainObject.getModel.andReturn(testModel);

                capability = new GraphCapability(
                    mockQ,
                    mockDomainObject
                );
            });

            it("is applicable to timelines", function () {
                expect(GraphCapability.appliesTo({
                    type: "timeline"
                })).toBeTruthy();
            });

            it("is applicable to activities", function () {
                expect(GraphCapability.appliesTo(testModel))
                    .toBeTruthy();
            });

            it("is not applicable to other objects", function () {
                expect(GraphCapability.appliesTo({
                    type: "something"
                })).toBeFalsy();
            });

            it("provides one graph per resource type", function () {
                var mockCallback = jasmine.createSpy('callback');

                mockDomainObject.useCapability.andReturn(asPromise([
                    { key: "abc", start: 0, end: 15 },
                    { key: "abc", start: 0, end: 15 },
                    { key: "def", start: 4, end: 15 },
                    { key: "xyz", start: 0, end: 20 }
                ]));

                capability.invoke().then(mockCallback);

                expect(mockCallback).toHaveBeenCalledWith({
                    abc: jasmine.any(Object),
                    def: jasmine.any(Object),
                    xyz: jasmine.any(Object)
                });
            });

            it("provides a battery graph for timelines with capacity", function () {
                var mockCallback = jasmine.createSpy('callback');
                testModel.capacity = 1000;
                testModel.type = "timeline";
                mockDomainObject.useCapability.andReturn(asPromise([
                    { key: "power", start: 0, end: 15 }
                ]));
                capability.invoke().then(mockCallback);
                expect(mockCallback).toHaveBeenCalledWith({
                    power: jasmine.any(Object),
                    battery: jasmine.any(Object)
                });
            });

        });
    }
);
