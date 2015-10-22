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

define([

], function (
) {
    "use strict";

    /**
     * Formats dates for display and parses dates from user input,
     * varying by a chosen time system.
     *
     * Time systems are typically specified as `system` properties
     * of domains in {@link TelemetryDomainMetadata}.
     *
     * If omitted/left undefined, the time system is presumed to be UTC time,
     * with its numeric interpretation being milliseconds since the
     * start of 1970.
     *
     * @interface DateService
     */

    /**
     * Check if the provided text can be parsed into a numeric
     * representation of a time in the specified time system.
     * @method validate
     * @memberof DateService#
     * @param {string} text the text to validate
     * @param {string} [key] a key identifying the time system
     * @returns {boolean} true if the text can be parsed
     */

    /**
     * Parse the provided into a numeric representation of a time
     * in the specified time system.
     *
     * Behavior of this method for invalid text is undefined; use
     * the `validate` method to check for validity first.
     *
     * @method parse
     * @memberof DateService#
     * @param {string} text the text to parse
     * @param {string} [key] a key identifying the time system
     * @returns {number} a numeric representation of the date/time
     */

    /**
     * Format the provided numeric representation of a time
     * into a human-readable string appropriate for that time system.
     *
     * If the time system is not recognized, the return value will be
     * `undefined`.
     *
     * @method format
     * @memberof DateService#
     * @param {number} value the time value to format
     * @param {string} [key] a key identifying the time system
     * @returns {string} a human-readable representation of the date/time
     */

    /**
     * Composites multiple DateService implementations such that
     * they can be used as one.
     * @memberof platform/commonUI/general
     * @constructor
     */
    function DateAggregator(dateProviders) {
        this.dateProviders = dateProviders;
    }

    DateAggregator.prototype.validate = function (text, key) {
        return this.dateProviders.some(function (provider) {
            return provider.validate(text, key);
        });
    };

    DateAggregator.prototype.format = function (value, key) {
        var i, text;
        for (i = 0; i < this.dateProviders.length; i += 1) {
            text = this.dateProviders[i].format(value, key);
            if (text !== undefined) {
                return text;
            }
        }
    };

    DateAggregator.prototype.parse = function (text, key) {
        var i;
        for (i = 0; i < this.dateProviders.length; i += 1) {
            if (this.dateProviders[i].validate(text, key)) {
                return this.dateProviders[i].parse(text, key);
            }
        }
    };

    return DateAggregator;
});
