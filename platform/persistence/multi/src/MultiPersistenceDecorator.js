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
 * This bundle implements a persistence service which uses ElasticSearch to
 * store documents.
 * @namespace platform/persistence/elastic
 */
define(
    ['./PersistenceTable'],
    function (PersistenceTable) {
        'use strict';

        function MultiPersistenceDecorator(
            persistenceService,
            $q,
            spaceMappings,
            defaultSpace,
            spaceToRemap
        ) {
            this.table = new PersistenceTable(
                persistenceService,
                $q,
                spaceMappings,
                defaultSpace
            );
            this.spaceToRemap = spaceToRemap;
            this.persistenceService = persistenceService;
            this.$q = $q;
        }

        // Public API
        MultiPersistenceDecorator.prototype.listSpaces = function () {
            var spaceToRemap = this.spaceToRemap,
                mappedSpaces = this.table.getSpaces();

            return this.persistenceService.listSpaces.then(function (spaces) {
                // Hide the existence of alternate spaces; make them
                // appear as the one global space for storing domain objects.
                return spaces.filter(function (space) {
                    return mappedSpaces.indexOf(space) === -1;
                }).concat([spaceToRemap]);
            });
        };

        MultiPersistenceDecorator.prototype.listObjects = function (space) {
            var persistenceService = this.persistenceService;
            if (space === this.spaceToRemap) {
                return this.$q.all(this.mappedSpaces.map(function (s) {
                    return persistenceService.listObjects(s);
                })).then(function (lists) {
                    return lists.reduce(function (a, b) {
                        return a.concat(b);
                    }, []);
                });
            }
            return persistenceService.listObjects(space);
        };

        MultiPersistenceDecorator.prototype.createObject = function (space, key, value) {
            var persistenceService = this.persistenceService,
                table = this.table;
            if (space === this.spaceToRemap) {
                return table.getSpace(value.location).then(function (s) {
                    return table.setSpace(key, s).then(function () {
                        return persistenceService.createObject(s, key, value);
                    });
                });
            }
            return persistenceService.createObject(space, key, value);
        };

        MultiPersistenceDecorator.prototype.readObject = function (space, key) {
            var persistenceService = this.persistenceService;
            if (space === this.spaceToRemap) {
                return this.table.getSpace(key).then(function (s) {
                    return persistenceService.readObject(s, key);
                });
            }
            return persistenceService.readObject(space, key);
        };

        MultiPersistenceDecorator.prototype.updateObject = function (space, key, value) {
            var persistenceService = this.persistenceService,
                table = this.table,
                self = this;
            if (space === this.spaceToRemap) {
                return this.table.getSpace(key).then(function (currentSpace) {
                    return this.table.getSpace(value.location).then(function (newSpace) {
                        // TODO: Also move children when space change happens?
                        return (newSpace === currentSpace) ?
                                persistenceService.updateObject(newSpace, key, value) :
                                self.createObject(space, key, value);
                    });
                });
            }
            return persistenceService.createObject(space, key, value);
        };

        MultiPersistenceDecorator.prototype.deleteObject = function (space, key, value) {
        };

        return MultiPersistenceDecorator;
    }
);
