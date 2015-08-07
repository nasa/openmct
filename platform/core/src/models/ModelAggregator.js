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

/**
 * Module defining ModelAggregator. Created by vwoeltje on 11/7/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * Allows multiple services which provide models for domain objects
         * to be treated as one.
         *
         * @memberof platform/core
         * @constructor
         * @param {ModelProvider[]} providers the model providers to be
         *        aggregated
         */
        function ModelAggregator($q, providers) {

            // Pick a domain object model to use, favoring the one
            // with the most recent timestamp
            function pick(a, b) {
                var aModified = (a || {}).modified || Number.NEGATIVE_INFINITY,
                    bModified = (b || {}).modified || Number.NEGATIVE_INFINITY;
                return (aModified > bModified) ? a : (b || a);
            }

            // Merge results from multiple providers into one
            // large result object.
            function mergeModels(provided, ids) {
                var result = {};
                ids.forEach(function (id) {
                    provided.forEach(function (models) {
                        if (models[id]) {
                            result[id] = pick(result[id], models[id]);
                        }
                    });
                });
                return result;
            }

            return {
                /**
                 * Get models with the specified identifiers.
                 *
                 * This will invoke the `getModels()` method of all providers
                 * given at constructor-time, and aggregate the result into
                 * one object.
                 *
                 * Note that the returned object may contain a subset or a
                 * superset of the models requested.
                 *
                 * @param {string[]} ids an array of domain object identifiers
                 * @returns {Promise.<object>} a promise for  an object
                 *          containing key-value pairs,
                 *          where keys are object identifiers and values
                 *          are object models.
                 * @memberof platform/core.ModelAggregator#
                 */
                getModels: function (ids) {
                    return $q.all(providers.map(function (provider) {
                        return provider.getModels(ids);
                    })).then(function (provided) {
                        return mergeModels(provided, ids);
                    });
                }
            };
        }

        return ModelAggregator;
    }
);
