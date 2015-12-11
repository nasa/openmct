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
         * Rover. Exposes two services to client code, one
         * @param $q
         * @param $http
         * @param REMS_WS_URL
         * @returns {{dictionary: exports, history: Function}}
         * @constructor
         */
        function RemsTelemetryServerAdapter($q, $http, REMS_WS_URL) {
            this.histories = {},
            this.deferreds = {};
            this.REMS_WS_URL = REMS_WS_URL;
            this.$q = $q;
            this.$http = $http;
        }

        /**
         * @private
         */
        RemsTelemetryServerAdapter.prototype.requestHistory = function(id) {
            var self = this;

            return this.$http.get(this.REMS_WS_URL).then(function(response){
                self.histories = {};
                /**
                 * All history is fetched in one go, cache it all to save round trips to the server on subsequent requests
                 */
                response.data.soles.forEach(function(solData){
                   for (var prop in solData){
                       self.histories[prop] = self.histories[prop] || [];
                       if (!isNaN(solData[prop])) {
                           self.histories[prop].unshift({
                               date: Date.parse(solData[TERRESTRIAL_DATE]),
                               value: solData[prop]
                           });
                       }
                   }
                });
                self.deferreds[id].resolve({id: id, values: self.histories[id]});
            });
        };

        /**
         *
         * @type {exports}
         */
        RemsTelemetryServerAdapter.prototype.dictionary = MSLDataDictionary;

        /**
         *
         * @param id
         * @returns {p.promise|{then, fail, end}|performPromise|deferred.promise|{}|*}
         */
        RemsTelemetryServerAdapter.prototype.history = function(id) {
            this.deferreds[id] = this.deferreds[id] || this.$q.defer();
            if (this.histories[id]) {
                this.deferreds[id].resolve({id: id, values: this.histories[id]});
            } else {
                this.histories = {};
                this.requestHistory(id);
            }
            return this.deferreds[id].promise;
        };

        return RemsTelemetryServerAdapter;
    });