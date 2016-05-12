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
/*global define*/
define(
    [],
    function() {
        /**
         * Implements an application-wide transaction state. Once a
         * transaction is started, calls to PersistenceCapability.persist()
         * will be deferred until a subsequent call to
         * TransactionService.commit() is made.
         *
         * @param $q
         * @constructor
         */
        function TransactionService($q, dirtyModelCache) {
            this.$q = $q;
            this.transaction = false;
            this.cache = dirtyModelCache;
        }

        TransactionService.prototype.startTransaction = function () {
            if (this.transaction) {
                throw "Transaction in progress";
            }
            this.transaction = true;
        };

        TransactionService.prototype.isActive = function () {
            return this.transaction;
        };

        /**
         * All persist calls deferred since the beginning of the transaction
         * will be committed. Any failures will be reported via a promise
         * rejection.
         * @returns {*}
         */
        TransactionService.prototype.commit = function () {
            var self = this;
                cache = this.cache.get();

            function keyToObject(key) {
                return cache[key];
            }

            function objectToPromise(object) {
                return object.getCapability('persistence').persist();
            }

            return this.$q.all(
                Object.keys(this.cache)
                    .map(keyToObject)
                    .map(objectToPromise))
                .then(function () {
                    self.transaction = false;
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
                cache = this.cache.get();

            function keyToObject(key) {
                return cache[key];
            }

            function objectToPromise(object) {
                return object.getCapability('persistence').refresh();
            }

            return this.$q.all(Object.keys(cache)
                .map(keyToObject)
                .map(objectToPromise))
                .then(function () {
                    self.transaction = false;
                });
        };

        return TransactionService;
});
