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
 * Module defining EventTelemetryProvider. Created by chacskaylo on 06/18/2015.
 */

import messages from './transcript.json';

class EventTelemetryProvider {
    constructor() {
        this.firstObservedTime = Date.now();
        this.latestObservedTime = Date.now();
        this.count = Math.floor((this.latestObservedTime - this.firstObservedTime) / this.interval);
    }

    generateData(timestamp, duration, name) {
        const utc = Math.floor(timestamp / duration) * duration;
        const domainDelta = utc - this.firstObservedTime;
        const ind = this.count % messages.length;
        const value = messages[ind] + " - [" + domainDelta.toString() + "]";

        return {
            name,
            utc,
            value
        };
    }

    supportsRequest(domainObject) {
        return domainObject.type === 'example.eventGenerator';
    }

    supportsSubscribe(domainObject) {
        return domainObject.type === 'example.eventGenerator';
    }

    subscribe(domainObject, callback) {
        const duration = domainObject.telemetry.duration * 1000;

        const interval = setInterval(() => {
            const now = Date.now();
            const datum = this.generateData(now, duration, domainObject.name);
            callback(datum);
        }, duration);

        return function () {
            clearInterval(interval);
        };
    }

    request(domainObject, options) {
        const start = options.start;
        const end = Math.min(Date.now(), options.end); // no future values
        const duration = domainObject.telemetry.duration * 1000;
        if (options.strategy === 'latest' || options.size === 1) {
            start = end;
        }

        const data = [];
        while (start <= end && data.length < 5000) {
            data.push(this.generateData(start, duration, domainObject.name));
            start += duration;
        }

        return Promise.resolve(data);
    };
}

export default EventTelemetryProvider;
