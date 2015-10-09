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
         * @memberof platform/core
         * @constructor
         * @implements {ModelService}
         * @param {PersistenceService} persistenceService the service in which
         *        domain object models are persisted.
         * @param $q Angular's $q service, for working with promises
         * @param {function} now a function which provides the current time
         * @param {string} space the name of the persistence space(s)
         *        from which models should be retrieved.
         * @param {string} spaces additional persistence spaces to use
         */
        function PersistedModelProvider(persistenceService, $q, now, space, spaces) {
            this.persistenceService = persistenceService;
            this.$q = $q;
            this.spaces = [space].concat(spaces || []);
            this.now = now;
        }

        // Take the most recently modified model, for cases where
        // multiple persistence spaces return models.
        function takeMostRecent(modelA, modelB) {
            return (!modelB || modelB.modified === undefined) ? modelA :
                    (!modelA || modelA.modified === undefined) ? modelB :
                            modelB.modified > modelA.modified ? modelB :
                                    modelA;
        }

        PersistedModelProvider.prototype.getModels = function (ids) {
            var persistenceService = this.persistenceService,
                $q = this.$q,
                spaces = this.spaces,
                space = this.space,
                now = this.now;

            // Load a single object model from any persistence spaces
            function loadModel(id) {
                return $q.all(spaces.map(function (space) {
                    return persistenceService.readObject(space, id);
                })).then(function (models) {
                    return models.reduce(takeMostRecent);
                });
            }

            // Ensure that models read from persistence have some
            // sensible timestamp indicating they've been persisted.
            function addPersistedTimestamp(model) {
                if (model && (model.persisted === undefined)) {
                    model.persisted = model.modified !== undefined ?
                            model.modified : now();
                }

                return model;
            }

            // Package the result as id->model
            function packageResult(models) {
                var result = {};
                ids.forEach(function (id, index) {
                    if (models[index]) {
                        result[id] = addPersistedTimestamp(models[index]);
                    }
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
        };

        return PersistedModelProvider;
    }
);
