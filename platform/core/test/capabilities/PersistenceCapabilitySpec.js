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
/*global define,Promise,describe,it,expect,beforeEach,waitsFor,jasmine*/
/*jslint es5: true */

/**
 * PersistenceCapabilitySpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/capabilities/PersistenceCapability"],
    function (PersistenceCapability) {
        "use strict";

        describe("The persistence capability", function () {
            var mockPersistenceService,
                mockIdentifierService,
                mockDomainObject,
                mockIdentifier,
                mockNofificationService,
                mockCacheService,
                mockQ,
                id = "object id",
                model,
                SPACE = "some space",
                persistence,
                happyPromise;

            function asPromise(value, doCatch) {
                return (value || {}).then ? value : {
                    then: function (callback) {
                        return asPromise(callback(value));
                    },
                    catch: function(callback) {
                        //Define a default 'happy' catch, that skips over the
                        // catch callback
                        return doCatch ? asPromise(callback(value)): asPromise(value);
                    }
                };
            }

            beforeEach(function () {
                happyPromise = asPromise(true);
                model = { someKey: "some value", name: "domain object"};

                mockPersistenceService = jasmine.createSpyObj(
                    "persistenceService",
                    [ "updateObject", "readObject", "createObject", "deleteObject" ]
                );

                mockIdentifierService = jasmine.createSpyObj(
                    'identifierService',
                    [ 'parse', 'generate' ]
                );
                mockIdentifier = jasmine.createSpyObj(
                    'identifier',
                    [ 'getSpace', 'getKey', 'getDefinedSpace' ]
                );
                mockQ = jasmine.createSpyObj(
                    "$q",
                    ["reject"]
                );
                mockNofificationService = jasmine.createSpyObj(
                    "notificationService",
                    ["error"]
                );
                mockCacheService = jasmine.createSpyObj(
                    "cacheService",
                    [ "get", "put", "remove", "all" ]
                );

                mockDomainObject = {
                    getId: function () { return id; },
                    getModel: function () { return model; },
                    useCapability: jasmine.createSpy()
                };
                // Simulate mutation capability
                mockDomainObject.useCapability.andCallFake(function (capability, mutator) {
                    if (capability === 'mutation') {
                        model = mutator(model) || model;
                    }
                });
                mockIdentifierService.parse.andReturn(mockIdentifier);
                mockIdentifier.getSpace.andReturn(SPACE);
                persistence = new PersistenceCapability(
                    mockCacheService,
                    mockPersistenceService,
                    mockIdentifierService,
                    mockNofificationService,
                    mockQ,
                    mockDomainObject
                );
            });

            describe("successful persistence", function() {
                beforeEach(function () {
                    mockPersistenceService.updateObject.andReturn(happyPromise);
                    mockPersistenceService.createObject.andReturn(happyPromise);
                });
                it("creates unpersisted objects with the persistence service", function () {
                    // Verify precondition; no call made during constructor
                    expect(mockPersistenceService.createObject).not.toHaveBeenCalled();

                    persistence.persist();

                    expect(mockPersistenceService.createObject).toHaveBeenCalledWith(
                        SPACE,
                        id,
                        model
                    );
                });

                it("updates previously persisted objects with the persistence service", function () {
                    // Verify precondition; no call made during constructor
                    expect(mockPersistenceService.updateObject).not.toHaveBeenCalled();

                    model.persisted = 12321;
                    persistence.persist();

                    expect(mockPersistenceService.updateObject).toHaveBeenCalledWith(
                        SPACE,
                        id,
                        model
                    );
                });

                it("reports which persistence space an object belongs to", function () {
                    expect(persistence.getSpace()).toEqual(SPACE);
                });

                it("updates persisted timestamp on persistence", function () {
                    model.modified = 12321;
                    persistence.persist();
                    expect(model.persisted).toEqual(12321);
                });
                it("refreshes the domain object model from persistence", function () {
                    var refreshModel = {someOtherKey: "some other value"};
                    mockPersistenceService.readObject.andReturn(asPromise(refreshModel));
                    persistence.refresh();
                    expect(model).toEqual(refreshModel);
                });

                it("does not overwrite unpersisted changes on refresh", function () {
                    var refreshModel = {someOtherKey: "some other value"},
                        mockCallback = jasmine.createSpy();
                    model.modified = 2;
                    model.persisted = 1;
                    mockPersistenceService.readObject.andReturn(asPromise(refreshModel));
                    persistence.refresh().then(mockCallback);
                    expect(model).not.toEqual(refreshModel);
                    // Should have also indicated that no changes were actually made
                    expect(mockCallback).toHaveBeenCalledWith(false);
                });

                it("does not trigger error notification on successful" +
                    " persistence", function () {
                    persistence.persist();
                    expect(mockQ.reject).not.toHaveBeenCalled();
                    expect(mockNofificationService.error).not.toHaveBeenCalled();
                });
            });

            describe("unsuccessful persistence", function() {
                var sadPromise = {
                        then: function(callback){
                            return asPromise(callback(0), true);
                        }
                    };
                beforeEach(function () {
                    mockPersistenceService.createObject.andReturn(sadPromise);
                });
                it("rejects on falsey persistence result", function () {
                    persistence.persist();
                    expect(mockQ.reject).toHaveBeenCalled();
                });

                it("notifies user on persistence failure", function () {
                    persistence.persist();
                    expect(mockQ.reject).toHaveBeenCalled();
                    expect(mockNofificationService.error).toHaveBeenCalled();
                });
            });
        });
    }
);
