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
/*global define,describe,it,expect,beforeEach,jasmine*/

define(
    ["../../src/representers/EditRepresenter"],
    function (EditRepresenter) {
        "use strict";

        describe("The Edit mode representer", function () {
            var mockQ,
                mockLog,
                mockScope,
                testRepresentation,
                mockDomainObject,
                mockPersistence,
                mockStatusCapability,
                mockCapabilities,
                representer;

            function mockPromise(value) {
                return {
                    then: function (callback) {
                        return mockPromise(callback(value));
                    }
                };
            }

            beforeEach(function () {
                mockQ = { when: mockPromise };
                mockLog = jasmine.createSpyObj("$log", ["info", "debug"]);
                mockScope = jasmine.createSpyObj("$scope", ["$watch", "$on"]);
                testRepresentation = { key: "test" };
                mockDomainObject = jasmine.createSpyObj("domainObject", [
                    "getId",
                    "getModel",
                    "getCapability",
                    "useCapability",
                    "hasCapability"
                ]);
                mockPersistence =
                    jasmine.createSpyObj("persistence", ["persist"]);
                mockStatusCapability =
                    jasmine.createSpyObj("statusCapability", ["get", "listen"]);
                mockStatusCapability.get.andReturn(false);
                mockCapabilities = {
                    'persistence': mockPersistence,
                    'status': mockStatusCapability
                };

                mockDomainObject.getModel.andReturn({});
                mockDomainObject.hasCapability.andReturn(true);
                mockDomainObject.useCapability.andReturn(true);
                mockDomainObject.getCapability.andCallFake(function(capability){
                    return mockCapabilities[capability];
                });

                representer = new EditRepresenter(mockQ, mockLog, mockScope);
                representer.represent(testRepresentation, mockDomainObject);
            });

            it("provides a commit method in scope", function () {
                expect(mockScope.commit).toEqual(jasmine.any(Function));
            });

            it("Sets edit view template on edit mode", function () {
                mockStatusCapability.listen.mostRecentCall.args[0](['editing']);
                expect(mockScope.viewObjectTemplate).toEqual('edit-object');
            });

            it("Cleans up listeners on scope destroy", function () {
                representer.listenHandle = jasmine.createSpy('listen');
                mockScope.$on.mostRecentCall.args[1]();
                expect(representer.listenHandle).toHaveBeenCalled();
            });

            it("mutates and persists upon observed changes", function () {
                mockScope.model = { someKey: "some value" };
                mockScope.configuration = { someConfiguration: "something" };

                mockScope.commit("Some message");

                // Should have mutated the object...
                expect(mockDomainObject.useCapability).toHaveBeenCalledWith(
                    "mutation",
                    jasmine.any(Function)
                );

                // ... and should have persisted the mutation
                expect(mockPersistence.persist).toHaveBeenCalled();

                // Finally, check that the provided mutation function
                // includes both model and configuratioon
                expect(
                    mockDomainObject.useCapability.mostRecentCall.args[1]()
                ).toEqual({
                    someKey: "some value",
                    configuration: {
                        test: { someConfiguration: "something" }
                    }
                });
            });


        });
    }
);
