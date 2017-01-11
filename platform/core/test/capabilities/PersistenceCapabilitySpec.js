/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
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

/**
 * PersistenceCapabilitySpec. Created by vwoeltje on 11/6/14.
 */
define(
    ["../../src/capabilities/PersistenceCapability"],
    (PersistenceCapability) => {

        describe("The persistence capability", () => {
            let mockPersistenceService,
                mockIdentifierService,
                mockDomainObject,
                mockIdentifier,
                mockNofificationService,
                mockCacheService,
                mockQ,
                key = "persistence key",
                id = "object identifier",
                model,
                SPACE = "some space",
                persistence,
                happyPromise;

            const asPromise = (value, doCatch) => {
                return (value || {}).then ? value : {
                    then: (callback) => {
                        return asPromise(callback(value));
                    },
                    catch: (callback) => {
                        //Define a default 'happy' catch, that skips over the
                        // catch callback
                        return doCatch ? asPromise(callback(value)) : asPromise(value);
                    }
                };
            }

            beforeEach(() => {
                happyPromise = asPromise(true);
                model = { someKey: "some value", name: "domain object"};

                mockPersistenceService = jasmine.createSpyObj(
                    "persistenceService",
                    ["updateObject", "readObject", "createObject", "deleteObject"]
                );

                mockIdentifierService = jasmine.createSpyObj(
                    'identifierService',
                    ['parse', 'generate']
                );
                mockIdentifier = jasmine.createSpyObj(
                    'identifier',
                    ['getSpace', 'getKey', 'getDefinedSpace']
                );
                mockQ = jasmine.createSpyObj(
                    "$q",
                    ["reject", "when"]
                );
                mockNofificationService = jasmine.createSpyObj(
                    "notificationService",
                    ["error"]
                );
                mockCacheService = jasmine.createSpyObj(
                    "cacheService",
                    ["get", "put", "remove", "all"]
                );

                mockDomainObject = {
                    getId: () => {
                        return id;
                    },
                    getModel: () => {
                        return model;
                    },
                    useCapability: jasmine.createSpy()
                };
                // Simulate mutation capability
                mockDomainObject.useCapability.andCallFake( (capability, mutator) => {
                    if (capability === 'mutation') {
                        model = mutator(model) || model;
                    }
                });
                mockIdentifierService.parse.andReturn(mockIdentifier);
                mockIdentifier.getSpace.andReturn(SPACE);
                mockIdentifier.getKey.andReturn(key);
                mockQ.when.andCallFake(asPromise);
                persistence = new PersistenceCapability(
                    mockCacheService,
                    mockPersistenceService,
                    mockIdentifierService,
                    mockNofificationService,
                    mockQ,
                    mockDomainObject
                );
            });

            describe("successful persistence", () => {
                beforeEach(() => {
                    mockPersistenceService.updateObject.andReturn(happyPromise);
                    mockPersistenceService.createObject.andReturn(happyPromise);
                });
                it("creates unpersisted objects with the persistence service", () => {
                    // Verify precondition; no call made during constructor
                    expect(mockPersistenceService.createObject).not.toHaveBeenCalled();

                    persistence.persist();

                    expect(mockPersistenceService.createObject).toHaveBeenCalledWith(
                        SPACE,
                        key,
                        model
                    );
                });

                it("updates previously persisted objects with the persistence service", () => {
                    // Verify precondition; no call made during constructor
                    expect(mockPersistenceService.updateObject).not.toHaveBeenCalled();

                    model.persisted = 12321;
                    persistence.persist();

                    expect(mockPersistenceService.updateObject).toHaveBeenCalledWith(
                        SPACE,
                        key,
                        model
                    );
                });

                it("reports which persistence space an object belongs to", () => {
                    expect(persistence.getSpace()).toEqual(SPACE);
                });

                it("updates persisted timestamp on persistence", () => {
                    model.modified = 12321;
                    persistence.persist();
                    expect(model.persisted).toEqual(12321);
                });
                it("refreshes the domain object model from persistence", () => {
                    let refreshModel = {someOtherKey: "some other value"};
                    model.persisted = 1;
                    mockPersistenceService.readObject.andReturn(asPromise(refreshModel));
                    persistence.refresh();
                    expect(model).toEqual(refreshModel);
                });

                it("does not trigger error notification on successful" +
                    " persistence", () => {
                    persistence.persist();
                    expect(mockQ.reject).not.toHaveBeenCalled();
                    expect(mockNofificationService.error).not.toHaveBeenCalled();
                });
            });

            describe("unsuccessful persistence", () => {
                let sadPromise = {
                        then: (callback) => {
                            return asPromise(callback(0), true);
                        }
                    };
                beforeEach(() => {
                    mockPersistenceService.createObject.andReturn(sadPromise);
                });
                it("rejects on falsey persistence result", () => {
                    persistence.persist();
                    expect(mockQ.reject).toHaveBeenCalled();
                });

                it("notifies user on persistence failure", () => {
                    persistence.persist();
                    expect(mockQ.reject).toHaveBeenCalled();
                    expect(mockNofificationService.error).toHaveBeenCalled();
                });
            });
        });
    }
);
