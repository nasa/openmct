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
    [],
    function () {
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
            this.transaction = false;

            this.onCommits = [];
            this.onCancels = [];
        }

        /**
         * Starts a transaction. While a transaction is active all calls to
         * [PersistenceCapability.persist](@link PersistenceCapability#persist)
         * will be queued until [commit]{@link #commit} or [cancel]{@link
         * #cancel} are called
         */
        TransactionService.prototype.startTransaction = function () {
            if (this.transaction) {
                //Log error because this is a programming error if it occurs.
                this.$log.error("Transaction already in progress");
            }
            this.transaction = true;
        };

        /**
         * @returns {boolean} If true, indicates that a transaction is in progress
         */
        TransactionService.prototype.isActive = function () {
            return this.transaction;
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
                this.onCommits.push(onCommit);
                if (onCancel) {
                    this.onCancels.push(onCancel);
                }
            } else {
                //Log error because this is a programming error if it occurs.
                this.$log.error("No transaction in progress");
            }

            return function () {
                this.onCommits = this.onCommits.filter(function (callback) {
                    return callback !== onCommit;
                });
                this.onCancels = this.onCancels.filter(function (callback) {
                    return callback !== onCancel;
                });
            }.bind(this);
        };

        /**
         * All persist calls deferred since the beginning of the transaction
         * will be committed.
         *
         * @returns {Promise} resolved when all persist operations have
         * completed. Will reject if any commit operations fail
         */
        TransactionService.prototype.commit = function () {
            var self = this,
                promises = [],
                onCommit;

            while (this.onCommits.length > 0) { // ...using a while in case some onCommit adds to transaction
                onCommit = this.onCommits.pop();
                try { // ...also don't want to fail mid-loop...
                    promises.push(onCommit());
                } catch (e) {
                    this.$log.error("Error committing transaction.");
                }
            }
            return this.$q.all(promises).then(function () {
                self.transaction = false;

                self.onCommits = [];
                self.onCancels = [];
            });
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
            var self = this,
                results = [],
                onCancel;

            while (this.onCancels.length > 0) {
                onCancel = this.onCancels.pop();
                try {
                    results.push(onCancel());
                } catch (error) {
                    this.$log.error("Error cancelling transaction.");
                }
            }
            return this.$q.all(results).then(function () {
                self.transaction = false;

                self.onCommits = [];
                self.onCancels = [];
            });
        };

        TransactionService.prototype.size = function () {
            return this.onCommits.length;
        };

        return TransactionService;
    });
