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
         * @memberof platform/core
         * @constructor
         * @implements {ModelService}
         * @param {Array} roots all `roots[]` extensions
         * @param $q Angular's $q, for promises
         * @param $log Anuglar's $log, for logging
         */
        function RootModelProvider(roots, $q, $log) {
            // Pull out identifiers to used as ROOT's
            var ids = roots.map(function (root) { return root.id; });

            // Assign an initial location to root models
            roots.forEach(function (root) {
                if (!root.model) {
                    root.model = {};
                }
                root.model.location = 'ROOT';
            });

            this.baseProvider = new StaticModelProvider(roots, $q, $log);
            this.rootModel = {
                name: "The root object",
                type: "root",
                composition: ids
            };
        }

        RootModelProvider.prototype.getModels = function (ids) {
            var rootModel = this.rootModel;
            return this.baseProvider.getModels(ids).then(function (models) {
                models.ROOT = rootModel;
                return models;
            });
        };

        return RootModelProvider;
    }
);
