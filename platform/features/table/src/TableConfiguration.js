/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2018, United States Government
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
/* global Set */
define(
    ['./TableColumn'],
    function (TableColumn) {

        /**
         * Class that manages table metadata, state, and contents.
         * @memberof platform/features/table
         * @param domainObject
         * @constructor
         */
        function TableConfiguration(domainObject, openmct) {
            this.domainObject = domainObject;
            this.openmct = openmct;
            this.timeSystemColumn = undefined;
            this.columns = [];
            this.headers = new Set();
            this.timeSystemColumnTitle = undefined;
        }

        /**
         * Build column definition based on supplied telemetry metadata
         * @param telemetryObject the telemetry producing object associated with this column
         * @param metadata Metadata describing the domains and ranges available
         * @returns {TableConfiguration} This object
         */
        TableConfiguration.prototype.addColumn = function (telemetryObject, metadatum) {
            var column = new TableColumn(this.openmct, telemetryObject, metadatum);

            if (column.isCurrentTimeSystem()) {
                if (!this.timeSystemColumnTitle) {
                    this.timeSystemColumnTitle = column.title();
                }
                column.title(this.timeSystemColumnTitle);
            }

            this.columns.push(column);
            this.headers.add(column.title());
        };

        /**
         * Retrieve and format values for a given telemetry datum.
         * @param telemetryObject The object that the telemetry data is
         * associated with
         * @param datum The telemetry datum to retrieve values from
         * @returns {Object} Key value pairs where the key is the column
         * title, and the value is the formatted value from the provided datum.
         */
        TableConfiguration.prototype.getRowValues = function (telemetryObject, limitEvaluator, datum) {
            return this.columns.reduce(function (rowObject, column) {
                var columnTitle = column.title();
                var columnValue = {
                    text: '',
                    value: undefined
                };
                if (rowObject[columnTitle] === undefined) {
                    rowObject[columnTitle] = columnValue;
                }

                if (column.hasValue(telemetryObject, datum)) {
                    columnValue = column.getValue(datum, limitEvaluator);

                    if (columnValue.text === undefined) {
                        columnValue.text = '';
                    }
                    // Don't replace something with nothing.
                    // This occurs when there are multiple columns with the same
                    // column title
                    if (rowObject[columnTitle].text === undefined ||
                        rowObject[columnTitle].text.length === 0) {
                        rowObject[columnTitle] = columnValue;
                    }
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
            this.headers.forEach(function (columnTitle) {
                configuration[columnTitle] =
                    typeof defaultConfig[columnTitle] === 'undefined' ? true :
                        defaultConfig[columnTitle];
            });

            //Synchronize column configuration with model
            if (this.domainObject.hasCapability('editor') &&
                this.domainObject.getCapability('editor').isEditContextRoot() &&
                configChanged(configuration, defaultConfig)) {
                this.saveColumnConfiguration(configuration);
            }

            return configuration;
        };

        return TableConfiguration;
    }
);
