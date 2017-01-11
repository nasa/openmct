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
    ["../../src/services/Transaction"],
    (Transaction) => {

        describe("A Transaction", () => {
            let mockLog,
                transaction;

            beforeEach( () => {
                mockLog = jasmine.createSpyObj(
                    '$log',
                    ['warn', 'info', 'error', 'debug']
                );
                transaction = new Transaction(mockLog);
            });

            it("initially has a size of zero", () => {
                expect(transaction.size()).toEqual(0);
            });

            describe("when callbacks are added", () => {
                let mockCommit,
                    mockCancel,
                    remove;

                beforeEach( () => {
                    mockCommit = jasmine.createSpy('commit');
                    mockCancel = jasmine.createSpy('cancel');
                    remove = transaction.add(mockCommit, mockCancel);
                });

                it("reports a new size", () => {
                    expect(transaction.size()).toEqual(1);
                });

                it("returns a function to remove those callbacks", () => {
                    expect(remove).toEqual(jasmine.any(Function));
                    remove();
                    expect(transaction.size()).toEqual(0);
                });

                describe("and the transaction is committed", () => {
                    beforeEach( () => {
                        transaction.commit();
                    });

                    it("triggers the commit callback", () => {
                        expect(mockCommit).toHaveBeenCalled();
                    });

                    it("does not trigger the cancel callback", () => {
                        expect(mockCancel).not.toHaveBeenCalled();
                    });
                });

                describe("and the transaction is cancelled", () => {
                    beforeEach( () => {
                        transaction.cancel();
                    });

                    it("triggers the cancel callback", () => {
                        expect(mockCancel).toHaveBeenCalled();
                    });

                    it("does not trigger the commit callback", () => {
                        expect(mockCommit).not.toHaveBeenCalled();
                    });
                });

                describe("and an exception is encountered during commit", () => {
                    beforeEach( () => {
                        mockCommit.andCallFake( () => {
                            throw new Error("test error");
                        });
                        transaction.commit();
                    });

                    it("logs an error", () => {
                        expect(mockLog.error).toHaveBeenCalled();
                    });
                });
            });

        });
    }
);

