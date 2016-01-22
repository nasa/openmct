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

define(
    ["./MSLDataDictionary"],
    function (MSLDataDictionary) {
        "use strict";

        var TERRESTRIAL_DATE = "terrestrial_date";

        /**
         * Fetches historical data from the REMS instrument on the Curiosity
         * Rover.
         * @memberOf example/msl
         * @param $q
         * @param $http
         * @param REMS_WS_URL The location of the REMS telemetry data.
         * @constructor
         */
        function RemsTelemetryServerAdapter($q, $http, REMS_WS_URL) {
            this.historyData = {},
            this.deferreds = {};
            this.REMS_WS_URL = REMS_WS_URL;
            this.$q = $q;
            this.$http = $http;
        }

        /**
         * The data dictionary for this data source.
         * @type {MSLDataDictionary}
         */
        RemsTelemetryServerAdapter.prototype.dictionary = MSLDataDictionary;

        /**
         * Fetches historical data from source, and associates it with the
         * given request ID.
         * @private
         */
        RemsTelemetryServerAdapter.prototype.requestHistory = function(id) {
            var self = this;

            return this.$http.get(this.REMS_WS_URL).then(function(response){
                /*
                 * Refresh history data on each request so that it's always
                 * current.
                 */
                self.historyData = {};
                /*
                 * History data is organised by Sol. Iterate over sols...
                 */
                response.data.soles.forEach(function(solData){
                    /*
                     * Each sol contains a number of properties for each
                     * piece of data available, eg. min ground temperature,
                     * avg air pressure, etc.
                     */
                    Object.keys(solData).forEach(function (prop) {
                       self.historyData[prop] = self.historyData[prop] || [];
                        /*
                         * Check that valid data exists
                         */
                       if (!isNaN(solData[prop])) {
                           /*
                            * Append each data point to the array of values
                            * for this data point property (min. temp, etc).
                            */
                           self.historyData[prop].unshift({
                               date: Date.parse(solData[TERRESTRIAL_DATE]),
                               value: solData[prop]
                           });
                       }
                   });
                });
                self.deferreds[id].resolve({id: id, values: self.historyData[id]});
            });
        };

        /**
         * Requests historical telemetry for the named data attribute. In
         * the case of REMS, this data source exposes multiple different
         * data variables from the REMS instrument, including temperature
         * and others
         * @param id The telemetry data point key to be queried.
         * @returns {Promise | Array<RemsTelemetryValue>} that resolves with an Array of {@link RemsTelemetryValue} objects for the request data key.
         */
        RemsTelemetryServerAdapter.prototype.history = function(id) {
            this.deferreds[id] = this.deferreds[id] || this.$q.defer();
            if (this.historyData[id]) {
                this.deferreds[id].resolve({id: id, values: this.historyData[id]});
            } else {
                this.historyData = {};
                this.requestHistory(id);
            }
            return this.deferreds[id].promise;
        };

        return RemsTelemetryServerAdapter;
    });