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
/*global define*/
define(
    ['./Transaction', './NestedTransaction'],
    function (Transaction, NestedTransaction) {
        /**
         * Implements an application-wide transaction state. Once a
         * transaction is started, calls to
         * [PersistenceCapability.persist()]{@link PersistenceCapability#persist}
         * will be deferred until a subsequent call to
         * [TransactionService.commit]{@link TransactionService#commit} is made.
         *
         * @memberof platform/commonUI/edit/services
         * @param $q
         * @constructor
         */
        function TransactionService($q, $log) {
            this.$q = $q;
            this.$log = $log;
            this.transaction = undefined;
            this.transactionStack = [];
        }

        /**
         * Starts a transaction. While a transaction is active all calls to
         * [PersistenceCapability.persist](@link PersistenceCapability#persist)
         * will be queued until [commit]{@link #commit} or [cancel]{@link
         * #cancel} are called
         */
        TransactionService.prototype.startTransaction = function () {
            if (this.transaction) {
                this.transactionStack.push(this.transaction);
                this.transaction = new NestedTransaction(this.transaction);
            } else {
                this.transaction = new Transaction(this.$log);
            }
        };

        /**
         * @returns {boolean} If true, indicates that a transaction is in progress
         */
        TransactionService.prototype.isActive = function () {
            return !!this.transaction;
        };

        /**
         * Adds provided functions to a queue to be called on
         * [.commit()]{@link #commit} or
         * [.cancel()]{@link #commit}
         * @param onCommit A function to call on commit
         * @param onCancel A function to call on cancel
         */
        TransactionService.prototype.addToTransaction = function (onCommit, onCancel) {
            if (this.transaction) {
                return this.transaction.add(onCommit, onCancel);
            } else {
                //Log error because this is a programming error if it occurs.
                this.$log.error("No transaction in progress");
            }
        };

        /**
         * All persist calls deferred since the beginning of the transaction
         * will be committed.
         *
         * @returns {Promise} resolved when all persist operations have
         * completed. Will reject if any commit operations fail
         */
        TransactionService.prototype.commit = function () {
            var transaction = this.transaction;
            this.transaction = this.transactionStack.pop();
            return transaction && transaction.commit();
        };

        /**
         * Cancel the current transaction, replacing any dirty objects from
         * persistence. Not a true rollback, as it cannot be used to undo any
         * persist calls that were successful in the event one of a batch of
         * persists failing.
         *
         * @returns {*}
         */
        TransactionService.prototype.cancel = function () {
            var transaction = this.transaction;
            this.transaction = this.transactionStack.pop();
            return transaction && transaction.cancel();
        };

        TransactionService.prototype.size = function () {
            return this.transaction ? this.transaction.size() : 0;
        };

        return TransactionService;
    });
