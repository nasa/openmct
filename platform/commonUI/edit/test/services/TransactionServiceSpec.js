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
/*global define,describe,it,expect,beforeEach,jasmine*/

define(
    ["../../src/services/TransactionService"],
    (TransactionService) => {

        describe("The Transaction Service", () => {
            let mockQ,
                mockLog,
                transactionService;

            const fastPromise = (val) => {
                return {
                    then: (callback) => {
                        return fastPromise(callback(val));
                    }
                };
            }

            beforeEach( () => {
                mockQ = jasmine.createSpyObj("$q", ["all"]);
                mockQ.all.andReturn(fastPromise());
                mockLog = jasmine.createSpyObj("$log", ["error"]);
                transactionService = new TransactionService(mockQ, mockLog);
            });

            it("isActive returns true if a transaction is in progress", () => {
                expect(transactionService.isActive()).toBe(false);
                transactionService.startTransaction();
                expect(transactionService.isActive()).toBe(true);
            });

            it("addToTransaction queues onCommit and onCancel functions", () => {
                var onCommit = jasmine.createSpy('onCommit'),
                    onCancel = jasmine.createSpy('onCancel');

                transactionService.startTransaction();
                transactionService.addToTransaction(onCommit, onCancel);
                expect(transactionService.size()).toBe(1);
            });

            it("size function returns size of commit and cancel queues", () => {
                var onCommit = jasmine.createSpy('onCommit'),
                    onCancel = jasmine.createSpy('onCancel');

                transactionService.startTransaction();
                transactionService.addToTransaction(onCommit, onCancel);
                transactionService.addToTransaction(onCommit, onCancel);
                transactionService.addToTransaction(onCommit, onCancel);
                expect(transactionService.size()).toBe(3);
            });

            describe("commit", () => {
                let onCommits;

                beforeEach( () => {
                    onCommits = [0, 1, 2].map( (val) => {
                            return jasmine.createSpy("onCommit" + val);
                        });

                    transactionService.startTransaction();
                    onCommits.forEach(transactionService.addToTransaction.bind(transactionService));
                });

                it("commit calls all queued commit functions", () => {
                    expect(transactionService.size()).toBe(3);
                    transactionService.commit();
                    onCommits.forEach( (spy) => {
                        expect(spy).toHaveBeenCalled();
                    });
                });

                it("commit resets active state and clears queues", () => {
                    transactionService.commit();
                    expect(transactionService.isActive()).toBe(false);
                    expect(transactionService.size()).toBe(0);
                    expect(transactionService.size()).toBe(0);
                });

            });

            describe("cancel", () => {
                let onCancels;

                beforeEach( () => {
                    onCancels = [0, 1, 2].map( (val) => {
                        return jasmine.createSpy("onCancel" + val);
                    });

                    transactionService.startTransaction();
                    onCancels.forEach( (onCancel) => {
                        transactionService.addToTransaction(undefined, onCancel);
                    });
                });

                it("cancel calls all queued cancel functions", () => {
                    expect(transactionService.size()).toBe(3);
                    transactionService.cancel();
                    onCancels.forEach(function (spy) {
                        expect(spy).toHaveBeenCalled();
                    });
                });

                it("cancel resets active state and clears queues", () => {
                    transactionService.cancel();
                    expect(transactionService.isActive()).toBe(false);
                    expect(transactionService.size()).toBe(0);
                });

            });

        });
    }
);
