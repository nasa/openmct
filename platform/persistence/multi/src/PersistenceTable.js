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

define(
    ['./AsyncMutex', './PersistenceTableInitializer'],
    function (AsyncMutex, PersistenceTableInitializer) {
        'use strict';

        function PersistenceTable(
            persistenceService,
            $q,
            spaceMappings,
            defaultSpace
        ) {
            var spaces = Object.keys(spaceMappings).map(function (id) {
                    return spaceMappings[id];
                }).sort().filter(function (item, i, arr) {
                    return i === 0 || arr[i - 1] !== item;
                }),
                initializer =
                    new PersistenceTableInitializer($q, persistenceService),
                self = this;


            this.mutex = new AsyncMutex();
            this.$q = $q;
            this.staticSpaceMappings = spaceMappings;
            this.defaultSpace = defaultSpace;
            this.observedSpaceMappings = {};

            this.mutex.acquire(function (release) {
                initializer.initialTable(spaces).then(function (table) {
                    self.observedSpaceMappings = table;
                }).then(release);
            });
        }

        PersistenceTable.prototype.setSpace = function (id, space) {
            var mappings = this.observedSpaceMappings;
            return this.mutex.use(function () {
                this.observedSpaceMappings[id] = space;
            });
        };

        PersistenceTable.prototype.getSpace = function (id) {
            var self = this;
            return this.mutex.use(function () {
                return self.staticSpaceMappings[id] ||
                    self.observedSpaceMappings[id];
            });
        };

    }
);
