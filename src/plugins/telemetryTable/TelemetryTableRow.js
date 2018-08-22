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

define([], function () {
    class TelemetryTableRow {
        constructor(datum, columns, objectKeyString, limitEvaluator) {
            this.columns = columns;
            this.columnCount = Object.keys(columns).length;

            this.datum = this.createNormalizedDatum(datum);
            this.limitEvaluator = limitEvaluator;
            this.objectKeyString = objectKeyString;

            this.formatCache = {};
            this.cacheSize = 0;
        }

        /**
         * Normalize the structure of datums to assist sorting and merging of columns.
         * Maps all sources to keys.
         * @private
         * @param {*} telemetryDatum
         * @param {*} metadataValues 
         */
        createNormalizedDatum(datum) {
            return Object.values(this.columns).reduce((normalizedDatum, column) => {
                normalizedDatum[column.getKey()] = column.getRawValue(datum);
                return normalizedDatum;
            }, {});
        }

        hasColumn(key) {
            return this.columns.hasOwnProperty(key);
        }

        isFromObject(objectKeyString) {
            return objectKeyString === this.objectKeyString;
        }

        getFormattedValue(key) {
            if (!this.formatCache[key]) {
                let column = this.columns[key];
                this.formatCache[key] = column.getFormattedValue(this.datum[key]);
                this.cacheSize++;
                
                if (this.cacheSize === this.columnCount) {
                    this.completeFormatCache = true;
                }
            }
            return this.formatCache[key];
        }

        getFormattedDatum() {
            if (!this.completeFormatCache) {
                this.buildFormatCache();
            }
            return this.formatCache;
        }

        getRowLimitClass() {
            if (!this.rowLimitClass) {
                let limitEvaluation = this.limitEvaluator.evaluate(this.datum); 
                this.rowLimitClass = limitEvaluation && limitEvaluation.cssClass;
            }
            return this.rowLimitClass;
        }

        getCellLimitClasses() {
            if (!this.cellLimitClasses) {
                this.cellLimitClasses = Object.values(this.columns).reduce((alarmStateMap, column) => {
                    let limitEvaluation = this.limitEvaluator.evaluate(this.datum, column.getMetadatum());
                    alarmStateMap[column.getKey()] = limitEvaluation && limitEvaluation.cssClass;
                    
                    return alarmStateMap;
                }, {});
            }
            return this.cellLimitClasses;
        }

        /**
         * @private
         */
        buildFormatCache() {
            Object.values(this.columns).forEach(column => this.getFormattedValue(column.getKey()));
        }
    }

    return TelemetryTableRow;
});