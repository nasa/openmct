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
    function () {
        'use strict';

        function TransactionalPersistenceCapability(
            $q,
            transactionService,
            dirtyModelCache,
            persistenceCapability,
            domainObject
        ) {
            this.transactionService = transactionService;
            this.dirtyModelCache = dirtyModelCache;
            this.persistenceCapability = Object.create(persistenceCapability);
            this.domainObject = domainObject;
            this.$q = $q;
        }

        TransactionalPersistenceCapability.prototype.persist = function () {
            var domainObject = this.domainObject,
                dirtyModelCache = this.dirtyModelCache;
            if (this.transactionService.isActive()) {
                dirtyModelCache.markDirty(domainObject);
                //Using $q here because need to return something
                // from which 'catch' can be chained
                return this.$q.when(true);
            } else {
                return this.persistenceCapability.persist().then(function (result) {
                    dirtyModelCache.markClean(domainObject);
                    return result;
                });
            }
        };

        TransactionalPersistenceCapability.prototype.refresh = function () {
            var domainObject = this.domainObject,
                dirtyModelCache = this.dirtyModelCache;

            return this.persistenceCapability.refresh().then(function (result) {
                dirtyModelCache.markClean(domainObject);
                return result;
            });
        };

        TransactionalPersistenceCapability.prototype.getSpace = function () {
            return this.persistenceCapability.getSpace();
        };

        return TransactionalPersistenceCapability;
    }
);
