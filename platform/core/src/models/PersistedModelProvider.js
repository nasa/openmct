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
         * @param {string} SPACE the name of the persistence space from which
         *        models should be retrieved.
         */
        function PersistedModelProvider(persistenceService, $q, space) {
            this.persistenceService = persistenceService;
            this.$q = $q;
            this.space = space;
        }

        PersistedModelProvider.prototype.getModels = function (ids) {
            var persistenceService = this.persistenceService,
                $q = this.$q,
                space = this.space;

            // Load a single object model from persistence
            function loadModel(id) {
                return persistenceService.readObject(space, id);
            }

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
        };

        return PersistedModelProvider;
    }
);
