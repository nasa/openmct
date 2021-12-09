/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
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

/**
 * Module defining EventTelemetry.
 * Created by chacskaylo on 06/18/2015.
 * Modified by shale on 06/23/2015.
 */

class EventTelemetry {
    constructor(interval) {
        this.interval = interval;
        this.firstObservedTime = Date.now();
        this.latestObservedTime = Date.now();
        this.count = Math.floor((this.latestObservedTime - this.firstObservedTime) / this.interval);
        this.generatorData = {};
    }

    getPointCount() {
        return this.count;
    }

    getDomainValue(i, domain) {
        return i * this.interval
            + (domain !== 'delta' ? this.firstObservedTime : 0);
    }

    getRangeValue(i, range) {
        var domainDelta = this.getDomainValue(i) - this.firstObservedTime,
            ind = i % this.messages.length;

        return this.messages[ind] + " - [" + domainDelta.toString() + "]";
    }
}
export default EventTelemetry;

