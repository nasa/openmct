/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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
    ["../../src/runs/TransactingMutationListener"],
    function (TransactingMutationListener) {

        xdescribe("TransactingMutationListener", function () {
            var mockTopic,
                mockMutationTopic,
                mockTransactionService,
                mockDomainObject,
                mockPersistence;

            beforeEach(function () {
                mockTopic = jasmine.createSpy('topic');
                mockMutationTopic =
                    jasmine.createSpyObj('mutation', ['listen']);
                mockTransactionService =
                    jasmine.createSpyObj('transactionService', [
                        'isActive',
                        'startTransaction',
                        'addToTransaction',
                        'commit'
                    ]);
                mockDomainObject = jasmine.createSpyObj(
                    'domainObject',
                    ['getId', 'getCapability', 'getModel']
                );
                mockPersistence = jasmine.createSpyObj(
                    'persistence',
                    ['persist', 'refresh', 'persisted']
                );

                mockTopic.andCallFake(function (t) {
                    return (t === 'mutation') && mockMutationTopic;
                });

                mockDomainObject.getCapability.andCallFake(function (c) {
                    return (c === 'persistence') && mockPersistence;
                });

                mockPersistence.persisted.andReturn(true);

                return new TransactingMutationListener(
                    mockTopic,
                    mockTransactionService
                );
            });

            it("listens for mutation", function () {
                expect(mockMutationTopic.listen)
                    .toHaveBeenCalledWith(jasmine.any(Function));
            });

            [false, true].forEach(function (isActive) {
                var verb = isActive ? "is" : "isn't";

                function onlyWhenInactive(expectation) {
                    return isActive ? expectation.not : expectation;
                }

                describe("when a transaction " + verb + " active", function () {
                    var innerVerb = isActive ? "does" : "doesn't";

                    beforeEach(function () {
                        mockTransactionService.isActive.andReturn(isActive);
                    });

                    describe("and mutation occurs", function () {
                        beforeEach(function () {
                            mockMutationTopic.listen.mostRecentCall
                                .args[0](mockDomainObject);
                        });


                        it(innerVerb + " start a new transaction", function () {
                            onlyWhenInactive(
                                expect(mockTransactionService.startTransaction)
                            ).toHaveBeenCalled();
                        });

                        it("adds to the active transaction", function () {
                            expect(mockTransactionService.addToTransaction)
                                .toHaveBeenCalledWith(
                                jasmine.any(Function),
                                jasmine.any(Function)
                            );
                        });

                        it(innerVerb + " immediately commit", function () {
                            onlyWhenInactive(
                                expect(mockTransactionService.commit)
                            ).toHaveBeenCalled();
                        });
                    });
                });
            });
        });
    }
);
