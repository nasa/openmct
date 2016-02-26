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
/*global define,moment*/

define(
    [
        './DomainColumn',
        './RangeColumn',
        './NameColumn'
    ],
    function (DomainColumn, RangeColumn, NameColumn) {
        "use strict";

        /**
         * Class that manages table metadata, state, and contents.
         * @memberof platform/features/table
         * @param domainObject
         * @constructor
         */
        function Table(domainObject, telemetryFormatter) {
            this.domainObject = domainObject;
            this.columns = [];
            this.telemetryFormatter = telemetryFormatter;
        }

        /**
         * Build column definitions based on supplied telemetry metadata
         * @param metadata Metadata describing the domains and ranges available
         * @returns {Table} This object
         */
        Table.prototype.buildColumns = function(metadata) {
            var self = this;

            this.columns = [];

            if (metadata) {
                metadata.forEach(function (metadatum) {
                    //Push domains first
                    metadatum.domains.forEach(function (domainMetadata) {
                        self.addColumn(new DomainColumn(domainMetadata, self.telemetryFormatter));
                    });
                    metadatum.ranges.forEach(function (rangeMetadata) {
                        self.addColumn(new RangeColumn(rangeMetadata, self.telemetryFormatter));
                    });
                });
            }
            return this;
        };

        /**
         * Add a column definition to this Table
         * @param {RangeColumn | DomainColumn | NameColumn} column
         * @param {Number} [index] Where the column should appear (will be
         * affected by column filtering)
         */
        Table.prototype.addColumn = function (column, index) {
            if (typeof index === 'undefined') {
                this.columns.push(column);
            } else {
                this.columns.splice(index, 0, column);
            }
        };

        /**
         * @private
         * @param column
         * @returns {*|string}
         */
        Table.prototype.getColumnTitle = function (column) {
                return column.getTitle();
        };

        /**
         * Get a simple list of column titles
         * @returns {Array} The titles of the columns
         */
        Table.prototype.getHeaders = function() {
            var self = this;
            return this.columns.map(function (column){
                return self.getColumnTitle(column);
            });
        };

        /**
         * Retrieve and format values for a given telemetry datum.
         * @param telemetryObject The object that the telemetry data is
         * associated with
         * @param datum The telemetry datum to retrieve values from
         * @returns {Object} Key value pairs where the key is the column
         * title, and the value is the formatted value from the provided datum.
         */
        Table.prototype.getRowValues = function(telemetryObject, datum) {
            var self = this;
            return this.columns.reduce(function(rowObject, column){
                var columnTitle = self.getColumnTitle(column),
                    columnValue = column.getValue(telemetryObject, datum);

                if (columnValue !== undefined && columnValue.text === undefined){
                    columnValue.text = '';
                }
                // Don't replace something with nothing.
                // This occurs when there are multiple columns with the
                // column title
                if (rowObject[columnTitle] === undefined || rowObject[columnTitle].text === undefined || rowObject[columnTitle].text.length === 0) {
                    rowObject[columnTitle] = columnValue;
                }
                return rowObject;
            }, {});
        };

        /**
         * @private
         */
        Table.prototype.defaultColumnConfiguration = function () {
            return ((this.domainObject.getModel().configuration || {}).table || {}).columns || {};
        };

        /**
         * As part of the process of building the table definition, extract
         * configuration from column definitions.
         * @returns {Object} A configuration object consisting of key-value
         * pairs where the key is the column title, and the value is a
         * boolean indicating whether the column should be shown.
         */
        Table.prototype.getColumnConfiguration = function() {
            var configuration = {},
                //Use existing persisted config, or default it
                defaultConfig = this.defaultColumnConfiguration();

            /**
             * For each column header, define a configuration value
             * specifying whether the column is visible or not. Default to
             * existing (persisted) configuration if available
             */
            this.getHeaders().forEach(function(columnTitle) {
                configuration[columnTitle] = typeof defaultConfig[columnTitle] === 'undefined' ? true : defaultConfig[columnTitle];
            });

            return configuration;
        };

        return Table;
    }
);
