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
// import _ from 'lodash';
import EventEmitter from 'EventEmitter';
import TelemetrySubscriptionService from './TelemetrySubscriptionService';
export class TelemetryCollection extends EventEmitter {

    constructor(openmct, options) {
        super();

        this.openmct = openmct;
        this.domainObject = options.domainObject;
        this.sortedTelemetry = [];

        this.timeSystem(openmct.time.timeSystem());
        this.lastBounds = openmct.time.bounds();

        this.historicalProvider = options.historicalProvider;
        this.subscriptionProvider = options.subscriptionProvider;

        this.options = options.options;

        this.listeners = {
            add: [],
            remove: []
        };

        this.trackHistoricalTelemetry();
        this.trackSubscriptionTelemetry();

        this.subscribeToBounds();
        this.trackTimeSystem();
    }

    trackHistoricalTelemetry() {
        if (!this.historicalProvider) {
            return;
        }

        // stuff
    }

    trackSubscriptionTelemetry() {
        if (!this.subscriptionProvider) {
            return;
        }

        this.subscriptionService = new TelemetrySubscriptionService();
        this.subscriptionService.subscribe(
            this.domainObject,
            this.processNewTelemetry,
            this.subscriptionProvider,
            this.options
        );
    }

    on(event, callback, options) {
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

    addOne(datum) {
        // if (this.sortOptions === undefined) {
        //     throw 'Please specify sort options';
        // }

        // let isDuplicate = false;

        // // Going to check for duplicates. Bound the search problem to
        // // items around the given time. Use sortedIndex because it
        // // employs a binary search which is O(log n). Can use binary search
        // // because the array is guaranteed ordered due to sorted insertion.
        // let startIx = this.sortedIndex(this.rows, row);
        // let endIx = undefined;

        // if (this.dupeCheck && startIx !== this.rows.length) {
        //     endIx = this.sortedLastIndex(this.rows, row);

        //     // Create an array of potential dupes, based on having the
        //     // same time stamp
        //     let potentialDupes = this.rows.slice(startIx, endIx + 1);
        //     // Search potential dupes for exact dupe
        //     isDuplicate = potentialDupes.some(_.isEqual.bind(undefined, row));
        // }

        // if (!isDuplicate) {
        //     this.rows.splice(endIx || startIx, 0, row);

        //     return true;
        // }

        // return false;
    }

    // used to sort any new telemetry (page, historical, subscription)
    processNewTelemetry(telemetryData) {
        let data = Array.isArray(telemetryData) ? telemetryData : [telemetryData];
        let parsedValue;
        let beforeStartOfBounds;
        let afterEndOfBounds;

        for (let datum of data) {
            parsedValue = this.parseTime(datum[this.sortOptions.key]);
            beforeStartOfBounds = parsedValue < this.lastBounds.start;
            afterEndOfBounds = parsedValue > this.lastBounds.end;

            if (!afterEndOfBounds && !beforeStartOfBounds) {
                return this.addOne(datum);
            } else if (afterEndOfBounds) {
                this.futureBuffer.addOne(datum);
            }
        }
    }

    parseTime() {

    }

    // returns a boolean if there is more telemetry within the time bounds if the provider supports it
    hasMorePages() {
        return true;
    }

    // will return the next "page" of telemetry if the provider supports it
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

    bounds(bounds) {
        let startChanged = this.lastBounds.start !== bounds.start;
        let endChanged = this.lastBounds.end !== bounds.end;

        let startIndex = 0;
        let endIndex = 0;

        let discarded = [];
        let added = [];
        let testValue = {
            datum: {}
        };

        this.lastBounds = bounds;

        if (startChanged) {
            testValue.datum[this.sortOptions.key] = bounds.start;
            // Calculate the new index of the first item within the bounds
            startIndex = this.sortedIndex(this.rows, testValue);
            discarded = this.rows.splice(0, startIndex);
        }

        if (endChanged) {
            testValue.datum[this.sortOptions.key] = bounds.end;
            // Calculate the new index of the last item in bounds
            endIndex = this.sortedLastIndex(this.futureBuffer.rows, testValue);
            added = this.futureBuffer.rows.splice(0, endIndex);
            added.forEach((datum) => this.rows.push(datum));
        }

        if (discarded && discarded.length > 0) {
            /**
             * A `discarded` event is emitted when telemetry data fall out of
             * bounds due to a bounds change event
             * @type {object[]} discarded the telemetry data
             * discarded as a result of the bounds change
             */
            this.emit('remove', discarded);
        }

        if (added && added.length > 0) {
            /**
             * An `added` event is emitted when a bounds change results in
             * received telemetry falling within the new bounds.
             * @type {object[]} added the telemetry data that is now within bounds
             */
            this.emit('add', added);
        }
    }

    timeSystem(timeSystem) {
        this.timeSystem = timeSystem;
        this.timeKey = this.openmct.time.timeSystem().key;
        this.formatter = this.openmct.telemetry.getValueFormatter({
            key: this.timeKey,
            source: this.timeKey,
            format: this.timeKey
        });
        this.parseTime = this.formatter.parse;

        // TODO: Reset right?
    }

    subscribeToBounds() {
        this.openmct.time.on('bounds', this.bounds);
    }

    unsubscribeFromBounds() {
        this.openmct.time.off('bounds', this.bounds);
    }

    subscribeToTimeSystem() {
        this.openmct.time.on('timeSystem', this.timeSystem);
    }

    unsubscribeFromTimeSystem() {
        this.openmct.time.off('bounds', this.timeSystem);
    }

    destroy() {
        this.unsubscribeFromBounds();
    }

}
