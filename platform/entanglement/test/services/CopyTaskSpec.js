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

/*global define,describe,beforeEach,it,jasmine,expect,spyOn */

define(
    [
        '../../src/services/CopyTask',
        '../DomainObjectFactory'
    ],
    function (CopyTask, domainObjectFactory) {
        'use strict';

        var ID_A = "some-string-with-vaguely-uuidish-uniqueness",
            ID_B = "some-other-similarly-unique-string";

        function synchronousPromise(value) {
            return (value && value.then) ? value : {
                then: function (callback) {
                    return synchronousPromise(callback(value));
                }
            };
        }

        describe("CopyTask", function () {
            var mockDomainObject,
                mockParentObject,
                mockPolicyService,
                mockQ,
                mockDeferred,
                testModel,
                mockCallback,
                counter,
                cloneIds,
                task;

            function makeMockCapabilities(childIds) {
                var mockCapabilities = {
                        persistence: jasmine.createSpyObj(
                            'persistence',
                            ['persist']
                        ),
                        composition: jasmine.createSpyObj(
                            'composition',
                            ['add', 'invoke']
                        ),
                        instantiation: jasmine.createSpyObj(
                            'instantiation',
                            ['instantiate', 'invoke']
                        )
                    },
                    mockChildren = (childIds || []).map(function (id) {
                        return domainObjectFactory({
                            id: id,
                            capabilities: makeMockCapabilities([]),
                            model: { originalId: id }
                        });
                    });

                mockCapabilities.persistence.persist
                    .andReturn(synchronousPromise(true));
                mockCapabilities.composition.add.andCallFake(function (obj) {
                    return synchronousPromise(obj);
                });
                mockCapabilities.composition.invoke
                    .andReturn(synchronousPromise(mockChildren));
                mockCapabilities.instantiation.invoke
                    .andCallFake(function (model) {
                        var id = "some-id-" + counter;
                        cloneIds[model.originalId] = id;
                        counter += 1;
                        return domainObjectFactory({
                            id: id,
                            model: model,
                            capabilities: makeMockCapabilities()
                        });
                    });

                return mockCapabilities;
            }

            beforeEach(function () {
                counter = 0;
                cloneIds = {};

                testModel = {
                    composition: [ ID_A, ID_B ],
                    someObj: {},
                    someArr: [ ID_A, ID_B ]
                };
                testModel.someObj[ID_A] = "some value";
                testModel.someObj.someProperty = ID_B;

                mockDomainObject = domainObjectFactory({
                    capabilities: makeMockCapabilities(testModel.composition),
                    model: testModel
                });
                mockParentObject = domainObjectFactory({
                    capabilities: makeMockCapabilities()
                });
                mockPolicyService = jasmine.createSpyObj(
                    'policyService',
                    [ 'allow' ]
                );
                mockQ = jasmine.createSpyObj('$q', ['when', 'defer', 'all']);
                mockDeferred = jasmine.createSpyObj(
                    'deferred',
                    [ 'notify', 'resolve', 'reject' ]
                );

                mockPolicyService.allow.andReturn(true);

                mockQ.when.andCallFake(synchronousPromise);
                mockQ.defer.andReturn(mockDeferred);
                mockQ.all.andCallFake(function (promises) {
                    return synchronousPromise(promises.map(function (promise) {
                        var value;
                        promise.then(function (v) { value = v; });
                        return value;
                    }));
                });

                mockDeferred.resolve.andCallFake(function (value) {
                    mockDeferred.promise = synchronousPromise(value);
                });

                task = new CopyTask(
                    mockDomainObject,
                    mockParentObject,
                    mockPolicyService,
                    mockQ
                );
            });


            describe("produces models which", function () {
                var model;

                beforeEach(function () {
                    task.perform().then(function (clone) {
                        model = clone.getModel();
                    });
                });

                it("contain rewritten identifiers in arrays", function () {
                    expect(model.someArr)
                        .toEqual(testModel.someArr.map(function (id) {
                            return cloneIds[id];
                        }));
                });

                it("contain rewritten identifiers in properties", function () {
                    expect(model.someObj.someProperty)
                        .toEqual(cloneIds[testModel.someObj.someProperty]);
                });


                it("contain rewritten identifiers in property names", function () {
                    expect(model.someObj[cloneIds[ID_A]])
                        .toEqual(testModel.someObj[ID_A]);
                });
            });

        });


    }
);
