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
        var TRANSACTION_SET = {};

        /**
         * Wraps persistence capability to enable transactions. Transactions
         * will cause persist calls not to be invoked immediately, but
         * rather queued until [EditorCapability.save()]{@link EditorCapability#save}
         * or [EditorCapability.cancel()]{@link EditorCapability#cancel} are
         * called.
         * @memberof platform/commonUI/edit/capabilities
         * @param $q
         * @param transactionService
         * @param persistenceCapability
         * @param domainObject
         * @constructor
         */
        function TransactionalPersistenceCapability(
            $q,
            transactionService,
            persistenceCapability,
            domainObject
        ) {
            this.transactionService = transactionService;
            this.persistenceCapability = persistenceCapability;
            this.domainObject = domainObject;
            this.$q = $q;
        }

        TransactionalPersistenceCapability.prototype.transactionClearer = function (state) {
            var id = this.domainObject.getId();
            if (arguments.length > 0) {
                TRANSACTION_SET[id] = state;
            }
            return TRANSACTION_SET[id];
        };

        /**
         * The wrapped persist function. If a transaction is active, persist
         * will be queued until the transaction is committed or cancelled.
         * @returns {*}
         */
        TransactionalPersistenceCapability.prototype.persist = function () {
            var self = this;

            function onCommit() {
                if (!self.transactionClearer()) {
                    return Promise.resolve(true);
                }
                return self.persistenceCapability.persist().then(function (result) {
                    self.transactionClearer(undefined);
                    return result;
                });
            }

            function onCancel() {
                if (self.domainObject.getModel().persisted !== undefined) {
                    //Fetch clean model from persistence
                    return self.persistenceCapability.refresh().then(function (result) {
                        self.transactionClearer(undefined);
                        return result;
                    });
                } else {
                    self.transactionClearer(undefined);
                    self.removeFromTransaction = undefined;
                    //Model is undefined in persistence, so return undefined.
                    return self.$q.when(undefined);
                }
            }

            if (this.transactionService.isActive()) {
                if (!self.transactionClearer()) {
                    this.transactionClearer(this.transactionService
                        .addToTransaction(onCommit, onCancel));
                }
                //Need to return a promise from this function
                return this.$q.when(true);
            } else {
                return this.persistenceCapability.persist();
            }
        };

        TransactionalPersistenceCapability.prototype.refresh = function () {
            if (this.transactionClearer()) {
                this.transactionClearer()();
                this.transactionClearer(undefined);
            }
            return this.persistenceCapability.refresh();
        };

        TransactionalPersistenceCapability.prototype.getSpace = function () {
            return this.persistenceCapability.getSpace();
        };

        return TransactionalPersistenceCapability;
    }
);
