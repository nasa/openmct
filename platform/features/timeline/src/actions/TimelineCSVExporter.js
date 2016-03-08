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
/*global define,Promise*/

define([
    "./IdColumn",
    "./ModeColumn",
    "./CompositionColumn",
    "./MetadataColumn",
    "./TimespanColumn"
], function (
    IdColumn,
    ModeColumn,
    CompositionColumn,
    MetadataColumn,
    TimespanColumn
) {
    'use strict';

    function TimelineCSVExporter(domainObjects) {
        var maxComposition = 0,
            maxRelationships = 0,
            columnNames = {},
            columns = [],
            foundTimespan = false,
            i;

        function addMetadataProperty(property) {
            var name = property.name;
            if (!columnNames[name]) {
                columnNames[name] = true;
                columns.push(new MetadataColumn(name));
            }
        }

        columns.push(new IdColumn());

        domainObjects.forEach(function (domainObject) {
            var model = domainObject.getModel(),
                compositionLength = model.composition ?
                    model.composition.length : 0,
                relationshipLength = (model.relationships || {}).modes ?
                    model.relationships.modes.length :
                    0,
                metadataProperties =
                    domainObject.useCapability('metadata') || [];

            maxComposition = Math.max(maxComposition, compositionLength);
            maxRelationships = Math.max(maxRelationships, relationshipLength);

            foundTimespan =
                foundTimespan || domainObject.hasCapability('timespan');

            metadataProperties.forEach(addMetadataProperty);
        });

        if (foundTimespan) {
            columns.push(new TimespanColumn(true));
            columns.push(new TimespanColumn(false));
        }

        for (i = 0; i < maxComposition; i += 1) {
            columns.push(new CompositionColumn(i));
        }

        for (i = 0; i < maxRelationships; i += 1) {
            columns.push(new ModeColumn(i));
        }

        this.domainObjects = domainObjects;
        this.columns = columns;
    }

    TimelineCSVExporter.prototype.rows = function () {
        var columns = this.columns;

        function toRow(domainObject) {
            return Promise.all(columns.map(function (column) {
                return column.value(domainObject);
            }));
        }

        return Promise.all(this.domainObjects.map(toRow));
    };

    TimelineCSVExporter.prototype.headers = function () {
        return this.columns.map(function (column) {
            return column.name();
        });
    };

    return TimelineCSVExporter;
});