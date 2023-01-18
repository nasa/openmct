/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2022, United States Government
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

import EventEmitter from 'EventEmitter';

export default class SinewaveLimitProvider extends EventEmitter {

    constructor(openmct) {
        super();

        this.openmct = openmct;
        this.observingStaleness = {};
        this.watchingTheClock = false;
        this.isRealTime = undefined;

        this.subscribeToStaleness = this.subscribeToStaleness.bind(this);
        this.handleClockUpdate = this.handleClockUpdate.bind(this);
        this.updateRealTime = this.updateRealTime.bind(this);
        this.updateStaleness = this.updateStaleness.bind(this);
    }

    supportsStaleness(domainObject) {
        return domainObject.type === 'generator';
    }

    subscribeToStaleness(domainObject, callback) {
        const id = this.openmct.objects.makeKeyString(domainObject.identifier);

        if (this.isRealTime === undefined) {
            this.updateRealTime(this.openmct.time.clock());
        }

        this.observingStaleness[id] = {
            isStale: false,
            callback
        };

        this.handleClockUpdate();

        const intervalId = setInterval(() => {
            if (domainObject.telemetry?.staleness === true && this.isRealTime) {
                this.updateStaleness(id, !this.observingStaleness[id].isStale);
            }
        }, 10000);

        return () => {
            clearInterval(intervalId);
            this.updateStaleness(id, false);
            this.handleClockUpdate();
            delete this.observingStaleness[id];
        };
    }

    handleClockUpdate() {
        let observers = Object.values(this.observingStaleness).length > 0;

        if (observers && !this.watchingTheClock) {
            this.watchingTheClock = true;
            this.openmct.time.on('clock', this.updateRealTime, this);
        } else if (!observers && this.watchingTheClock) {
            this.watchingTheClock = false;
            this.openmct.time.off('clock', this.updateRealTime, this);
        }
    }

    updateRealTime(clock) {
        this.isRealTime = clock !== undefined;

        if (!this.isRealTime) {
            Object.keys(this.observingStaleness).forEach((id) => {
                this.updateStaleness(id, false);
            });
        }
    }

    updateStaleness(id, isStale) {
        this.observingStaleness[id].isStale = isStale;
        this.observingStaleness[id].callback(this.observingStaleness[id].isStale);
        this.emit('stalenessEvent', {
            id,
            isStale: this.observingStaleness[id].isStale
        });
    }
}
