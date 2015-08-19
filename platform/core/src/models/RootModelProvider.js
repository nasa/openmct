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
/*global define,Promise*/

/**
 * Module defining RootModelProvider. Created by vwoeltje on 11/7/14.
 */
define(
    ['./StaticModelProvider'],
    function (StaticModelProvider) {
        "use strict";

        /**
         * Provides the root object (id = "ROOT"), which is the top-level
         * domain object shown when the application is started, from which all
         * other domain objects are reached.
         *
         * The root model provider works as the static model provider,
         * except that it aggregates roots[] instead of models[], and
         * exposes them all as composition of the root object ROOT,
         * whose model is also provided by this service.
         *
         * @constructor
         */
        function RootModelProvider(roots, $q, $log) {
            // Pull out identifiers to used as ROOT's, while setting locations.
            var ids = roots.map(function (root) {
                    if (!root.model) root.model = {};
                    root.model.location = 'ROOT';
                    return root.id;
                }),
                baseProvider = new StaticModelProvider(roots, $q, $log);

            function addRoot(models) {
                models.ROOT = {
                    name: "The root object",
                    type: "root",
                    composition: ids
                };
                return models;
            }

            return {

                /**
                 * Get models with the specified identifiers.
                 *
                 * Note that the returned object may contain a subset or a
                 * superset of the models requested.
                 *
                 * @param {string[]} ids an array of domain object identifiers
                 * @returns {Promise.<object>} a promise for  an object
                 *          containing key-value pairs,
                 *          where keys are object identifiers and values
                 *          are object models.
                 */
                getModels: function (ids) {
                    return baseProvider.getModels(ids).then(addRoot);
                }
            };
        }

        return RootModelProvider;
    }
);
