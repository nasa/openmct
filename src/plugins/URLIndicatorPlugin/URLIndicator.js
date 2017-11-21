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

        // Set of connection states; changing among these states will be
        // reflected in the indicator's appearance.
        // CONNECTED: Everything nominal, expect to be able to read/write.
        // DISCONNECTED: HTTP failed; maybe misconfigured, disconnected.
        // PENDING: Still trying to connect, and haven't failed yet.
        var CONNECTED = {
                glyphClass: "ok"
            },
            PENDING = {
                glyphClass: 'caution'
            },
            DISCONNECTED = {
                glyphClass: "err"
            };
        function URLIndicator($http, $interval) {
            var self = this;
            this.cssClass = this.options.cssClass ? this.options.cssClass : "icon-database";
            this.URLpath = this.options.url;
            this.label = this.options.label ? this.options.label : this.options.url;
            this.interval = this.options.interval || 10000;
            this.state = PENDING;

            function handleError(e) {
                self.state = DISCONNECTED;
            }
            function handleResponse() {
                self.state = CONNECTED;
            }
            function updateIndicator() {
                $http.get(self.URLpath).then(handleResponse, handleError);
            }
            updateIndicator();
            $interval(updateIndicator, self.interval, 0, false);
        }

        URLIndicator.prototype.getCssClass = function () {
            return this.cssClass;
        };
        URLIndicator.prototype.getGlyphClass = function () {
            return this.state.glyphClass;
        };
        URLIndicator.prototype.getText = function () {
            switch (this.state) {
                case CONNECTED: {
                    return this.label + " is connected";
                }
                case PENDING: {
                    return "Checking status of " + this.label + " please stand by...";
                }
                case DISCONNECTED: {
                    return this.label + " is offline";
                }
            }
        };
        URLIndicator.prototype.getDescription = function () {
            switch (this.state) {
                case CONNECTED: {
                    return this.label + " is online, checking status every " +
                    this.interval + " milliseconds.";
                }
                case PENDING: {
                    return "Checking status of " + this.label + " please stand by...";
                }
                case DISCONNECTED: {
                    return this.label + " is offline, checking status every " +
                    this.interval + " milliseconds";
                }
            }
        };
        return URLIndicator;
    });
