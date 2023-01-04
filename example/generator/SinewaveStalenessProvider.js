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
    }

    supportsStaleness(domainObject) {
        return domainObject.type === 'generator';
    }

    subscribeToStaleness(domainObject, callback) {
        const id = this.openmct.objects.makeKeyString(domainObject.identifier);

        this.observingStaleness[id] = {
            isStale: false,
            callback
        };

        const intervalId = setInterval(() => {
            if (domainObject.telemetry?.staleness === true) {
                this.observingStaleness[id].isStale = !this.observingStaleness[id].isStale;
                this.observingStaleness[id].callback(this.observingStaleness[id].isStale);
                this.emit('stalenessEvent', {
                    id,
                    isStale: this.observingStaleness[id].isStale
                });
            }
        }, 10000);

        return () => {
            clearInterval(intervalId);
            delete this.observingStaleness[id];
        };
    }
}
