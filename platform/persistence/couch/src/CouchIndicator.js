/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2020, United States Government
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

        // Set of connection states; changing among these states will be
        // reflected in the indicator's appearance.
        // CONNECTED: Everything nominal, expect to be able to read/write.
        // DISCONNECTED: HTTP failed; maybe misconfigured, disconnected.
        // SEMICONNECTED: Connected to the database, but it reported an error.
        // PENDING: Still trying to connect, and haven't failed yet.
        var CONNECTED = {
                text: "Connected",
                glyphClass: "ok",
                statusClass: "s-status-on",
                description: "Connected to the domain object database."
            },
            DISCONNECTED = {
                text: "Disconnected",
                glyphClass: "err",
                statusClass: "s-status-caution",
                description: "Unable to connect to the domain object database."
            },
            SEMICONNECTED = {
                text: "Unavailable",
                glyphClass: "caution",
                statusClass: "s-status-caution",
                description: "Database does not exist or is unavailable."
            },
            PENDING = {
                text: "Checking connection...",
                statusClass: "s-status-caution"
            };

        /**
         * Indicator for the current CouchDB connection. Polls CouchDB
         * at a regular interval (defined by bundle constants) to ensure
         * that the database is available.
         * @constructor
         * @memberof platform/persistence/couch
         * @implements {Indicator}
         * @param $http Angular's $http service
         * @param $interval Angular's $interval service
         * @param {string} path the URL to poll to check for couch availability
         * @param {number} interval the interval, in milliseconds, to poll at
         */
        function CouchIndicator($http, $interval, path, interval) {
            var self = this;

            // Track the current connection state
            this.state = PENDING;

            this.$http = $http;
            this.$interval = $interval;
            this.path = path;
            this.interval = interval;

            // Callback if the HTTP request to Couch fails
            function handleError() {
                self.state = DISCONNECTED;
            }

            // Callback if the HTTP request succeeds. CouchDB may
            // report an error, so check for that.
            function handleResponse(response) {
                var data = response.data;
                self.state = data.error ? SEMICONNECTED : CONNECTED;
            }

            // Try to connect to CouchDB, and update the indicator.
            function updateIndicator() {
                $http.get(path).then(handleResponse, handleError);
            }

            // Update the indicator initially, and start polling.
            updateIndicator();
            $interval(updateIndicator, interval);
        }

        CouchIndicator.prototype.getCssClass = function () {
            return "c-indicator--clickable icon-suitcase " + this.state.statusClass;
        };

        CouchIndicator.prototype.getGlyphClass = function () {
            return this.state.glyphClass;
        };

        CouchIndicator.prototype.getText = function () {
            return this.state.text;
        };

        CouchIndicator.prototype.getDescription = function () {
            return this.state.description;
        };

        return CouchIndicator;
    }
);
