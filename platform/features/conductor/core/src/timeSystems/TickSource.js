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

define([], function () {
    /**
     * A tick source is an event generator such as a timing signal, or
     * indicator of data availability, which can be used to advance the Time
     * Conductor. Usage is simple, a listener registers a callback which is
     * invoked when this source 'ticks'.
     *
     * @interface
     * @constructor
     */
    function TickSource() {
        this.listeners = [];
    }

    /**
     * @param callback Function to be called when this tick source ticks.
     * @returns an 'unlisten' function that will remove the callback from
     * the registered listeners
     */
    TickSource.prototype.listen = function (callback) {
        throw new Error('Not implemented');
    };

    return TickSource;
});
