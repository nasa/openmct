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

define([], function () {

    /**
     * Formatter for basic numbers. Provides basic support for non-UTC
     * numbering systems
     *
     * @implements {Format}
     * @constructor
     * @memberof platform/commonUI/formats
     */
    function NumberFormat() {
    }

    NumberFormat.prototype.format = function (value) {
        if (isNaN(value)) {
            return '';
        } else {
            return '' + value;
        }
    };

    NumberFormat.prototype.parse = function (text) {
        return parseFloat(text);
    };

    NumberFormat.prototype.validate = function (text) {
        return !isNaN(text);
    };

    return NumberFormat;
});
