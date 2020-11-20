/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2020, United States Government
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
import _ from 'lodash';
import EventEmitter from 'EventEmitter';

export class TelemetryCollection extends EventEmitter {

    constructor(openmct, options) {
        super();

        this.domainObject = options.domainObject;
        this.historical = options.historicalProvider;
        this.subscription = options.subscriptionProvider;
        this.telemetry = [];
        this.openmct = openmct;
        this.listeners = {
            add: [],
            remove: []
        };

        this.lastBounds = openmct.time.bounds();
        this.subscribeToBounds();
    }

    on(event, callback) {
        if (!this.listeners[event]) {
            throw new Error('Event not supported by Telemetry Collections: ' + event);
        }

        if (event === 'add') {
            // add
        }

        if (event === 'remove') {
            // remove
        }

        this.listeners[event].push({
            callback: callback
        });
    }

    off(event, callback) {
        if (!this.listeners[event]) {
            throw new Error('Event not supported by Telemetry Collections: ' + event);
        }

        const index = this.listeners[event].findIndex(l => {
            return l.callback === callback;
        });

        if (index === -1) {
            throw new Error('Tried to remove a listener that does not exist');
        }

        this.listeners[event].splice(index, 1);
    }

    // returns a boolean if there is more telemetry within the time bounds
    hasMorePages() {
        return true;
    }

    // will return the next "page" of telemetry
    nextPage() {

    }

    sortBy(sortOptions) {
        // if (arguments.length > 0) {
        //     this.sortOptions = sortOptions;
        //     this.rows = _.orderBy(this.rows, (row) => row.getParsedValue(sortOptions.key), sortOptions.direction);
        //     this.emit('sort');
        // }

        // Return duplicate to avoid direct modification of underlying object
        // return Object.assign({}, this.sortOptions);
        return true;
    }

    unsubscribeFromBounds() {
        this.openmct.time.off('bounds', this.bounds);
    }

    subscribeToBounds() {
        this.openmct.time.on('bounds', this.bounds);
    }

    destroy() {
        this.unsubscribeFromBounds();
    }

}
