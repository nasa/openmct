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

define(function () {
    /**
     * This is the namespace for MCT.
     * @namespace mct
     * @type {MCT}
     */

    /**
     * The Open MCT application itself. In order to extend its functionality,
     * extensions may be installed to MCT before it is run.
     *
     * The {@link mct} namespace is itself an instance of the MCT object.
     *
     * @constructor
     * @memberof mct
     */
    function MCT() {

    }

    /**
     *
     * @param {mct.Category.<T>} category
     * @param {function extension
     * @template T
     */
    MCT.prototype.register = function (category, extension) {

    };

    MCT.prototype.namespace = function (namespace) {

    };

    /**
     * Start running Open MCT in its current configuration.
     */
    MCT.prototype.start = function () {

    };

    return MCT;
});
