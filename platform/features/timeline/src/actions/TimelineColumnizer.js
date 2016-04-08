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

    /**
     * A description of how to populate a given column within a
     * prepared table of domain object data, for CSV export.
     * @interface platform/features/timeline.TimelineCSVColumn
     */

    /**
     * Get the value that belongs in this column for a given
     * domain object.
     * @memberof {platform/features/timeline.TimelineCSVColumn#}
     * @method value
     * @param {DomainObject} domainObject the domain object
     *        represented by this row
     * @returns {string|Promise<string>} the value for this cell
     */

    /**
     * Get the name of this column, as belongs in a header.
     * @memberof {platform/features/timeline.TimelineCSVColumn#}
     * @method name
     * @returns {string} the name of this column
     */

    /**
     * Handles conversion of a list of domain objects to a table
     * representation appropriate for CSV export.
     *
     * @param {DomainObject[]} domainObjects the objects to include
     *        in the exported data
     * @constructor
     * @memberof {platform/features/timeline}
     */
    function TimelineColumnizer(domainObjects) {
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
                composition = model.composition,
                relationships = model.relationships,
                modes = relationships && relationships.modes,
                metadataProperties = domainObject.useCapability('metadata');

            if (composition) {
                maxComposition = Math.max(maxComposition, composition.length);
            }

            if (modes) {
                maxRelationships = Math.max(maxRelationships, modes.length);
            }

            if (domainObject.hasCapability('timespan')) {
                foundTimespan = true;
            }

            if (metadataProperties) {
                metadataProperties.forEach(addMetadataProperty);
            }
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

    /**
     * Get a tabular representation of domain object data.
     * Each row corresponds to a single object; each element
     * in each row corresponds to a property designated by
     * the `headers`, correlated by index.
     * @returns {Promise.<string[][]>} domain object data
     */
    TimelineColumnizer.prototype.rows = function () {
        var columns = this.columns;

        function toRow(domainObject) {
            return Promise.all(columns.map(function (column) {
                return column.value(domainObject);
            }));
        }

        return Promise.all(this.domainObjects.map(toRow));
    };

    /**
     * Get the column headers associated with this tabular
     * representation of objects.
     * @returns {string[]} column headers
     */
    TimelineColumnizer.prototype.headers = function () {
        return this.columns.map(function (column) {
            return column.name();
        });
    };

    return TimelineColumnizer;
});
