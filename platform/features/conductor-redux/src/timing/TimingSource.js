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

define([
    "EventEmitter"
], function (EventEmitter) {

    /**
     * An interface defining a timing source. A timing source is a local or remote source of 'tick' events.
     * Could be used to tick when new data is received from a data source.
     * @interface
     * @constructor
     */
    function TimingSource(){
        EventEmitter.call(this);
    }

    TimingSource.prototype = Object.create(EventEmitter.prototype);

    /**
     * Attach to the timing source. If it's a local clock, will start a local timing loop. If remote, will connect to
     * remote source. If event driven (eg. based on data availability) will attach an event listener to telemetry source.
     */
    TimingSource.prototype.attach = function () {};

    /**
     * Detach from the timing source
     */
    TimingSource.prototype.detach = function () {};

    /**
     * @returns {boolean} true if current attached to timing source
     */
    TimingSource.prototype.attached = function () {}


});
