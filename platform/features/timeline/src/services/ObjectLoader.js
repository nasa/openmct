/*****************************************************************************
 * Open MCT Web, Copyright (c) 2009-2015, United States Government
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

        /**
         * The ObjectLoader is a utility service for loading subgraphs
         * of the composition hierarchy, starting at a provided object,
         * and optionally filtering out objects which fail to meet certain
         * criteria.
         * @constructor
         */
        function ObjectLoader($q) {

            // Build up an object containing id->object pairs
            // for the subset of the graph that is relevant.
            function loadSubGraph(domainObject, criterion) {
                var result = { domainObject: domainObject, composition: [] },
                    visiting = {},
                    filter;

                // Check object existence (for criterion-less filtering)
                function exists(domainObject) {
                    return !!domainObject;
                }

                // Check for capability matching criterion
                function hasCapability(domainObject) {
                    return domainObject && domainObject.hasCapability(criterion);
                }

                // For the recursive step...
                function loadSubGraphFor(childObject) {
                    return loadSubGraph(childObject, filter);
                }

                // Store loaded subgraphs into the result
                function storeSubgraphs(subgraphs) {
                    result.composition = subgraphs;
                }

                // Avoid infinite recursion
                function notVisiting(domainObject) {
                    return !visiting[domainObject.getId()];
                }

                // Put the composition of this domain object into the result
                function mapIntoResult(composition) {
                    return $q.all(
                        composition.filter(filter).filter(notVisiting)
                            .map(loadSubGraphFor)
                    ).then(storeSubgraphs);
                }

                // Used to give the final result after promise chaining
                function giveResult() {
                    // Stop suppressing recursive visitation
                    visiting[domainObject.getId()] = true;
                    // And return the expecting result value
                    return result;
                }

                // Load composition for
                function loadComposition() {
                    // First, record that we're looking at this domain
                    // object to detect cycles and avoid an infinite loop
                    visiting[domainObject.getId()] = true;
                    // Look up the composition, store it to the graph structure
                    return domainObject.useCapability('composition')
                        .then(mapIntoResult)
                        .then(giveResult);
                }

                // Choose the filter function to use
                filter = typeof criterion === 'function' ? criterion :
                        (typeof criterion === 'string' ? hasCapability :
                                exists);

                // Load child hierarchy, then provide the flat list
                return domainObject.hasCapability('composition') ?
                        loadComposition() : $q.when(result);
            }

            return {
                /**
                 * Load domain objects contained in the subgraph of the
                 * composition hierarchy which starts at the specified
                 * domain object, optionally pruning out objects (and their
                 * subgraphs) which match a certain criterion.
                 * The result is given as a promise for an object containing
                 * key-value pairs, where keys are domain object identifiers
                 * and values are domain objects in the subgraph.
                 * The criterion may be omitted (in which case no pruning is
                 * done) or specified as a string, in which case it will be
                 * treated as the name of a required capability, or specified
                 * as a function, which should return a truthy/falsy value
                 * when called with a domain object to indicate whether or
                 * not it should be included in the result set.
                 *
                 * @param {DomainObject} domainObject the domain object to
                 *        start from
                 * @param {string|Function} [criterion] the criterion used
                 *        to prune domain objects
                 * @returns {Promise} a promise for loaded domain objects
                 */
                load: loadSubGraph
            };
        }

        return ObjectLoader;
    }
);