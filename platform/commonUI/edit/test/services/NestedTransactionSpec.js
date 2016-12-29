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

define(["../../src/services/NestedTransaction"], (NestedTransaction) => {
    let TRANSACTION_METHODS = ['add', 'commit', 'cancel', 'size'];

    describe("A NestedTransaction", () => {
        let mockTransaction,
            nestedTransaction;

        beforeEach( () => {
            mockTransaction =
                jasmine.createSpyObj('transaction', TRANSACTION_METHODS);
            nestedTransaction = new NestedTransaction(mockTransaction);
        });

        it("exposes a Transaction's interface", () => {
            TRANSACTION_METHODS.forEach( (method) => {
                expect(nestedTransaction[method])
                    .toEqual(jasmine.any(Function));
            });
        });

        describe("when callbacks are added", () => {
            let mockCommit,
                mockCancel,
                remove;

            beforeEach( () => {
                mockCommit = jasmine.createSpy('commit');
                mockCancel = jasmine.createSpy('cancel');
                remove = nestedTransaction.add(mockCommit, mockCancel);
            });

            it("does not interact with its parent transaction", () => {
                TRANSACTION_METHODS.forEach( (method) => {
                    expect(mockTransaction[method])
                        .not.toHaveBeenCalled();
                });
            });

            describe("and the transaction is committed", () => {
                beforeEach( () => {
                    nestedTransaction.commit();
                });

                it("adds to its parent transaction", () => {
                    expect(mockTransaction.add).toHaveBeenCalledWith(
                        jasmine.any(Function),
                        jasmine.any(Function)
                    );
                });
            });
        });
    });
});


