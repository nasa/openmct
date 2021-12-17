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
    generateData(timestamp, duration, name) {
        return {
            key: request.key,
            telemetry: new EventTelemetry(this.genInterval)
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
            var now = Date.now();
            var datum = generateData(now, duration, domainObject.name);
            datum.value = String(datum.value);
            callback(datum);
        }, duration);

        return function () {
            clearInterval(interval);
        };
    }
}

export default EventTelemetryProvider;
