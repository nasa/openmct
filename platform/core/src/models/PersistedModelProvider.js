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
 * Module defining PersistedModelProvider. Created by vwoeltje on 11/12/14.
 */
define(
    [],
    function () {
        "use strict";

        /**
         * A model service which reads domain object models from an external
         * persistence service.
         *
         * @constructor
         * @param {PersistenceService} persistenceService the service in which
         *        domain object models are persisted.
         * @param $q Angular's $q service, for working with promises
         * @param {string} SPACE the name of the persistence space from which
         *        models should be retrieved.
         */
        function PersistedModelProvider(persistenceService, $q, SPACE) {
            // Load a single object model from persistence
            function loadModel(id) {
                return persistenceService.readObject(SPACE, id);
            }

            // Promise all persisted models (in id->model form)
            function promiseModels(ids) {
                // Package the result as id->model
                function packageResult(models) {
                    var result = {};
                    ids.forEach(function (id, index) {
                        result[id] = models[index];
                    });
                    return result;
                }

                // Filter out "namespaced" identifiers; these are
                // not expected to be found in database. See WTD-659.
                ids = ids.filter(function (id) {
                    return id.indexOf(":") === -1;
                });

                // Give a promise for all persistence lookups...
                return $q.all(ids.map(loadModel)).then(packageResult);
            }

            return {
                /**
                 * Get models with the specified identifiers.
                 *
                 * This will invoke the underlying persistence service to
                 * retrieve object models which match the provided
                 * identifiers.
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
                getModels: promiseModels
            };
        }


        return PersistedModelProvider;
    }
);