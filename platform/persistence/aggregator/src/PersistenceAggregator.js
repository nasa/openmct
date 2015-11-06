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

/*global define,window*/

define(
    [],
    function () {
        'use strict';

        var METHOD_DEFAULTS = {
            createObject: false,
            readObject: undefined,
            listObjects: [],
            updateObject: false,
            deleteObject: false
        };

        /**
         * @memberof platform/persistence/aggregator
         * @constructor
         * @implements {PersistenceService}
         * @param q Angular's $q, for promises
         */
        function PersistenceAggregator($q, providers) {
            var providerMap = {};

            function addToMap(provider) {
                return provider.listSpaces().then(function (spaces) {
                    spaces.forEach(function (space) {
                        providerMap[space] = providerMap[space] || provider;
                    });
                });
            }

            this.$q = $q;
            this.providerMapPromise = $q.all(providers.map(addToMap))
                .then(function () { return providerMap; });
        }

        PersistenceAggregator.prototype.listSpaces = function () {
            return this.providerMapPromise.then(function (map) {
                return Object.keys(map);
            });
        };

        Object.keys(METHOD_DEFAULTS).forEach(function (method) {
            PersistenceAggregator.prototype[method] = function (space) {
                var delegateArgs = arguments.slice(0);
                return this.providerMapPromise.then(function (map) {
                    var provider = map[space];
                    return provider ?
                            provider.apply(provider, delegateArgs) :
                            METHOD_DEFAULTS[method];
                });
            };
        });

        return PersistenceAggregator;
    }
);
