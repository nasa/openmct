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

define([], function () {

    var MUTATION_TRACKER = new WeakMap();
    /**
     * Listens for mutation on domain objects and triggers persistence when
     * it occurs.
     * @param {Topic} topic the `topic` service; used to listen for mutation
     * @memberof platform/core
     */
    function TransactingMutationListener(
        topic,
        transactionService,
        cacheService
    ) {
        var mutationTopic = topic('mutation');
        mutationTopic.listen(function (domainObject) {
            var persistence = domainObject.getCapability('persistence');
            var wasActive = transactionService.isActive();
            if (persistence.persisted()) {
                if (!wasActive) {
                    transactionService.startTransaction();
                }

                if (!MUTATION_TRACKER.has(domainObject)) {
                    MUTATION_TRACKER.set(domainObject, domainObject
                        .getCapability('mutation')
                        .listen(function () {})
                    );
                }

                cacheService.put(domainObject.getId(), domainObject.getModel());

                function unlistenAndCall(f) {
                    return function () {
                        if (MUTATION_TRACKER.has(domainObject)) {
                            MUTATION_TRACKER.get(domainObject)();
                            MUTATION_TRACKER.delete(domainObject);
                        }
                        return f();
                    }
                }

                transactionService.addToTransaction(
                    unlistenAndCall(persistence.persist.bind(persistence)),
                    unlistenAndCall(persistence.refresh.bind(persistence))
                );

                if (!wasActive) {
                    transactionService.commit();
                }
            }
        });
    }

    return TransactingMutationListener;
});
