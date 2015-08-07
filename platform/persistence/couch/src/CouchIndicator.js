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
    [],
    function () {
        "use strict";

        // Set of connection states; changing among these states will be
        // reflected in the indicator's appearance.
        // CONNECTED: Everything nominal, expect to be able to read/write.
        // DISCONNECTED: HTTP failed; maybe misconfigured, disconnected.
        // SEMICONNECTED: Connected to the database, but it reported an error.
        // PENDING: Still trying to connect, and haven't failed yet.
        var CONNECTED = {
                text: "Connected",
                glyphClass: "ok",
                description: "Connected to the domain object database."
            },
            DISCONNECTED = {
                text: "Disconnected",
                glyphClass: "err",
                description: "Unable to connect to the domain object database."
            },
            SEMICONNECTED = {
                text: "Unavailable",
                glyphClass: "caution",
                description: "Database does not exist or is unavailable."
            },
            PENDING = {
                text: "Checking connection..."
            };

        /**
         * Indicator for the current CouchDB connection. Polls CouchDB
         * at a regular interval (defined by bundle constants) to ensure
         * that the database is available.
         * @constructor
         * @memberof platform/persistence/couch
         */
        function CouchIndicator($http, $interval, PATH, INTERVAL) {
            // Track the current connection state
            var state = PENDING;

            // Callback if the HTTP request to Couch fails
            function handleError(err) {
                state = DISCONNECTED;
            }

            // Callback if the HTTP request succeeds. CouchDB may
            // report an error, so check for that.
            function handleResponse(response) {
                var data = response.data;
                state = data.error ? SEMICONNECTED : CONNECTED;
            }

            // Try to connect to CouchDB, and update the indicator.
            function updateIndicator() {
                $http.get(PATH).then(handleResponse, handleError);
            }

            // Update the indicator initially, and start polling.
            updateIndicator();
            $interval(updateIndicator, INTERVAL);

            return {
                /**
                 * Get the glyph (single character used as an icon)
                 * to display in this indicator. This will return "D",
                 * which should appear as a database icon.
                 * @returns {string} the character of the database icon
                 * @memberof platform/persistence/couch.CouchIndicator#
                 */
                getGlyph: function () {
                    return "D";
                },
                /**
                 * Get the name of the CSS class to apply to the glyph.
                 * This is used to color the glyph to match its
                 * state (one of ok, caution or err)
                 * @returns {string} the CSS class to apply to this glyph
                 * @memberof platform/persistence/couch.CouchIndicator#
                 */
                getGlyphClass: function () {
                    return state.glyphClass;
                },
                /**
                 * Get the text that should appear in the indicator.
                 * @returns {string} brief summary of connection status
                 * @memberof platform/persistence/couch.CouchIndicator#
                 */
                getText: function () {
                    return state.text;
                },
                /**
                 * Get a longer-form description of the current connection
                 * space, suitable for display in a tooltip
                 * @returns {string} longer summary of connection status
                 * @memberof platform/persistence/couch.CouchIndicator#
                 */
                getDescription: function () {
                    return state.description;
                }
            };

        }

        return CouchIndicator;
    }
);
