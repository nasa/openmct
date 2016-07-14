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

define([], function () {
    /**
     * Manages transactions to support the TransactionalPersistenceCapability.
     */
    function TransactionManager(transactionService) {
        this.transactionService = transactionService;
        this.clearTransactionFns = {};
    }

    TransactionManager.prototype.isActive = function () {
        return this.transactionService.isActive();
    };

    TransactionManager.prototype.isScheduled = function (domainObject) {
        return !!this.clearTransactionFns[domainObject.getId()];
    };

    TransactionManager.prototype.addToTransaction = function (
        domainObject,
        onCommit,
        onCancel
    ) {
        var release = this.releaseClearFn.bind(this, domainObject);

        function chain(promiseFn, nextFn) {
            return function () {
                return promiseFn().then(nextFn);
            };
        }

        if (!this.isScheduled(domainObject)) {
            this.clearTransactionFns[domainObject.getId()] =
                this.transactionService.addToTransaction(
                    chain(onCommit, release),
                    chain(onCancel, release)
                );
        }
    };

    TransactionManager.prototype.clearTransactionsFor = function (domainObject) {
        if (this.isScheduled(domainObject)) {
            this.clearTransactionFns[domainObject.getId()]();
            this.releaseClearFn(domainObject);
        }
    };

    TransactionManager.prototype.releaseClearFn = function (domainObject) {
        delete this.clearTransactionFns[domainObject.getId()];
    };

    return TransactionManager;
});
