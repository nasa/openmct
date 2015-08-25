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

        /**
         * Utility function for creating getter-setter functions,
         * since these are frequently useful for element proxies.
         *
         * An optional third argument may be supplied in order to
         * constrain or modify arguments when using as a setter;
         * this argument is a function which takes two arguments
         * (the current value for the property, and the requested
         * new value.) This is useful when values need to be kept
         * in certain ranges; specifically, to keep x/y positions
         * non-negative in a fixed position view.
         *
         * @memberof platform/features/layout
         * @constructor
         * @param {Object} object the object to get/set values upon
         * @param {string} key the property to get/set
         * @param {function} [updater] function used to process updates
         */
        function AccessorMutator(object, key, updater) {
            return function (value) {
                if (arguments.length > 0) {
                    object[key] = updater ?
                            updater(value, object[key]) :
                            value;
                }
                return object[key];
            };
        }

        return AccessorMutator;
    }
);
