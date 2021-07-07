/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2021, United States Government
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
import DefaultClock from '../../utils/clock/default-clock';

/**
 * A {@link openmct.TimeAPI.Clock} that updates the temporal bounds of the
 * application based on UTC time values provided by a ticking local clock,
 * with the periodicity specified.
 * @param {number} period The periodicity with which the clock should tick
 * @constructor
 */

export default class RemoteClock extends DefaultClock {
    constructor(openmct, identifier) {
        super();

        this.key = 'remote-clock';

        this.openmct = openmct;
        this.identifier = identifier;

        this.name = 'Remote Clock';
        this.description = "Provides telemetry based timestamps from a configurable source.";

        this.remoteTelemetryObject = undefined;
        this.telemetryObjectedLoaded = new Promise((resolve, reject) => {
            this.openmct.objects.get(identifier).then((domainObject) => {
                this.remoteTelemetryObject = domainObject;
                resolve();
            }).catch((error) => {
                throw new Error(error);
            });
        });

        // // for now
        // this.period = period;
        // this.timeoutHandle = undefined;
        // this.lastTick = Date.now();

        console.log('remote clock installed for identifier', identifier);
    }

    async start() {
        await this.telemetryObjectedLoaded;

        this.unsubscribe = this.openmct.telemetry.subscribe(this.remoteTelemetryObject, (datum) => {
            console.log('subscribe', datum);
            this.tick()
        });
    }

    stop() {
        this.unsubscribe();
    }

    tick(tickValue) {
        const now = Date.now();
        this.emit("tick", tickValue);
        this.lastTick = now;
    }
}
