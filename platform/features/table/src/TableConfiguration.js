/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2016, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

define(
    [],
    function () {

        /**
         * Class that manages table metadata, state, and contents.
         * @memberof platform/features/table
         * @param domainObject
         * @constructor
         */
        function TableConfiguration(domainObject, openmct) {
            this.domainObject = domainObject;
            this.columns = [];
            this.openmct = openmct;
        }

        /**
         * Build column definitions based on supplied telemetry metadata
         * @param metadata Metadata describing the domains and ranges available
         * @returns {TableConfiguration} This object
         */
        TableConfiguration.prototype.populateColumns = function (metadata) {
            var self = this;
            var telemetryApi = this.openmct.telemetry;

            this.columns = [];

            if (metadata) {

                metadata.forEach(function (metadatum) {
                    var formatter = telemetryApi.getValueFormatter(metadatum);

                    self.addColumn({
                        metadata: metadatum,
                        getTitle: function () {
                            return metadatum.name;
                        },
                        getValue: function(telemetryDatum, limitEvaluator) {
                            var isValueColumn = !!(metadatum.hints.y || metadatum.hints.range);
                            var alarm = isValueColumn &&
                                        limitEvaluator &&
                                        limitEvaluator.evaluate(telemetryDatum, metadatum);

                            return {
                                cssClass: alarm && alarm.cssClass,
                                text: formatter ? formatter.format(telemetryDatum[metadatum.key])
                                    : telemetryDatum[metadatum.key],
                                value: telemetryDatum[metadatum.key]
                            }
                        }
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
        TableConfiguration.prototype.addColumn = function (column, index) {
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
        TableConfiguration.prototype.getColumnTitle = function (column) {
            return column.getTitle();
        };

        /**
         * Get a simple list of column titles
         * @returns {Array} The titles of the columns
         */
        TableConfiguration.prototype.getHeaders = function () {
            return this.columns.map(function (column, i) {
                return column.getTitle()|| 'Column ' + (i + 1);
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
        TableConfiguration.prototype.getRowValues = function (limitEvaluator, datum) {
            var self = this;
            return this.columns.reduce(function (rowObject, column, i) {
                var columnTitle = self.getColumnTitle(column) || 'Column ' + (i + 1),
                    columnValue = column.getValue(datum, limitEvaluator);

                if (columnValue !== undefined && columnValue.text === undefined) {
                    columnValue.text = '';
                }
                // Don't replace something with nothing.
                // This occurs when there are multiple columns with the
                // column title
                if (rowObject[columnTitle] === undefined ||
                    rowObject[columnTitle].text === undefined ||
                    rowObject[columnTitle].text.length === 0) {
                    rowObject[columnTitle] = columnValue;
                }
                return rowObject;
            }, {});
        };

        /**
         * @private
         */
        TableConfiguration.prototype.defaultColumnConfiguration = function () {
            return ((this.domainObject.getModel().configuration || {}).table || {}).columns || {};
        };

        /**
         * Set the established configuration on the domain object
         * @private
         */
        TableConfiguration.prototype.saveColumnConfiguration = function (columnConfig) {
            this.domainObject.useCapability('mutation', function (model) {
                model.configuration = model.configuration || {};
                model.configuration.table = model.configuration.table || {};
                model.configuration.table.columns = columnConfig;
            });
        };

        function configChanged(config1, config2) {
            var config1Keys = Object.keys(config1),
                config2Keys = Object.keys(config2);

            return (config1Keys.length !== config2Keys.length) ||
                config1Keys.some(function (key) {
                    return config1[key] !== config2[key];
                });
        }

        /**
         * As part of the process of building the table definition, extract
         * configuration from column definitions.
         * @returns {Object} A configuration object consisting of key-value
         * pairs where the key is the column title, and the value is a
         * boolean indicating whether the column should be shown.
         */
        TableConfiguration.prototype.buildColumnConfiguration = function () {
            var configuration = {},
                //Use existing persisted config, or default it
                defaultConfig = this.defaultColumnConfiguration();

            /**
             * For each column header, define a configuration value
             * specifying whether the column is visible or not. Default to
             * existing (persisted) configuration if available
             */
            this.getHeaders().forEach(function (columnTitle) {
                configuration[columnTitle] =
                    typeof defaultConfig[columnTitle] === 'undefined' ? true :
                        defaultConfig[columnTitle];
            });

            //Synchronize column configuration with model
            if (configChanged(configuration, defaultConfig)) {
                this.saveColumnConfiguration(configuration);
            }

            return configuration;
        };

        return TableConfiguration;
    }
);
