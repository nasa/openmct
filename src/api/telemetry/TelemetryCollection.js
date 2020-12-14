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
import TelemetrySubscriptionService from './TelemetrySubscriptionService';

function bindUs() {
    return [
        'trackHistoricalTelemetry',
        'trackSubscriptionTelemetry',
        'addPage',
        'processNewTelemetry',
        'hasMorePages',
        'nextPage',
        'bounds',
        'timeSystem',
        'on',
        'off',
        'emit',
        'subscribeToBounds',
        'unsubscribeFromBounds',
        'subscribeToTimeSystem',
        'unsubscribeFromTimeSystem',
        'destroy'
    ];
}

export class TelemetryCollection {

    constructor(openmct, domainObject, options) {
        bindUs().forEach(method => this[method] = this[method].bind(this));

        this.openmct = openmct;
        this.domainObject = domainObject;
        this.boundedTelemetry = [];
        this.futureBuffer = [];

        this.parseTime = undefined;
        this.timeSystem(openmct.time.timeSystem());
        this.lastBounds = openmct.time.bounds();

        this.historicalProvider = options.historicalProvider;
        this.subscriptionProvider = options.subscriptionProvider;

        this.arguments = options.arguments;

        this.listeners = {
            add: [],
            remove: []
        };

        this.trackHistoricalTelemetry();
        this.trackSubscriptionTelemetry();

        this.subscribeToBounds();
        this.subscribeToTimeSystem();
    }

    // should we wait to track history until an 'add' listener is added?
    async trackHistoricalTelemetry() {
        if (!this.historicalProvider) {
            return;
        }

        // remove for reset
        if (this.boundedTelemetry.length !== 0) {
            this.emit('remove', this.boundedTelemetry);
            this.boundedTelemetry = [];
        }

        let historicalData = await this.historicalProvider.request.apply(this.domainObject, this.arguments).catch((rejected) => {
            this.openmct.notifications.error('Error requesting telemetry data, see console for details');
            console.error(rejected);

            return Promise.reject(rejected);
        });

        // make sure it wasn't rejected
        if (Array.isArray(historicalData)) {
            // reset on requests, should only happen on initial load,
            // bounds manually changed and time system changes
            this.boundedTelemetry = historicalData;
            this.emit('add', [...this.boundedTelemetry]);
        }
    }

    trackSubscriptionTelemetry() {
        if (!this.subscriptionProvider) {
            return;
        }

        this.subscriptionService = new TelemetrySubscriptionService(this.openmct);
        this.unsubscribe = this.subscriptionService.subscribe(
            this.domainObject,
            this.processNewTelemetry,
            this.subscriptionProvider,
            this.arguments
        );
    }

    // utilized by telemetry provider to add more data
    addPage(telemetryData) {
        this.processNewTelemetry(telemetryData);
    }

    // used to sort any new telemetry (add/page, historical, subscription)
    processNewTelemetry(telemetryData) {

        let data = Array.isArray(telemetryData) ? telemetryData : [telemetryData];
        let parsedValue;
        let beforeStartOfBounds;
        let afterEndOfBounds;
        let added = [];

        for (let datum of data) {
            parsedValue = this.parseTime(datum);
            beforeStartOfBounds = parsedValue < this.lastBounds.start;
            afterEndOfBounds = parsedValue > this.lastBounds.end;

            if (!afterEndOfBounds && !beforeStartOfBounds) {
                if (!this.boundedTelemetry.includes(datum)) {
                    this.boundedTelemetry.push(datum);
                    added.push(datum);
                }
            } else if (afterEndOfBounds) {
                this.futureBuffer.push(datum);
            }
        }

        if (added.length) {
            this.emit('add', added);
        }
    }

    // returns a boolean if there is more telemetry within the time bounds 
    // if the provider supports it
    hasMorePages() {
        return this.historicalProvider
            && this.historicalProvider.supportsPaging()
            && this.historicalProvider.hasMorePages(this);
    }

    // will return the next "page" of telemetry if the provider supports it
    nextPage() {
        if (!this.historicalProvider || !this.historicalProvider.supportsPaging()) {
            throw new Error('Provider does not support paging');
        }

        this.historicalProvider.nextPage(this.arguments, this);
    }

    // when user changes bounds, or when bounds increment from a tick
    bounds(bounds, isTick) {

        this.lastBounds = bounds;

        if (isTick) {
            // need to check futureBuffer and need to check
            // if anything has fallen out of bounds
        } else {
            // TODO: also reset right?
            // need to reset and request history again
            // no need to mess with subscription
        }

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

        if (discarded.length > 0) {
            /**
             * A `discarded` event is emitted when telemetry data fall out of
             * bounds due to a bounds change event
             * @type {object[]} discarded the telemetry data
             * discarded as a result of the bounds change
             */
            this.emit('remove', discarded);
        }

        if (added.length > 0) {
            /**
             * An `added` event is emitted when a bounds change results in
             * received telemetry falling within the new bounds.
             * @type {object[]} added the telemetry data that is now within bounds
             */
            this.emit('add', added);
        }
    }

    timeSystem(timeSystem) {
        let timeKey = timeSystem.key;
        let formatter = this.openmct.telemetry.getValueFormatter({
            key: timeKey,
            source: timeKey,
            format: timeKey
        });

        this.parseTime = formatter.parse;

        // TODO: Reset right?
    }

    on(event, callback, context) {
        if (!this.listeners[event]) {
            throw new Error('Event not supported by Telemetry Collections: ' + event);
        }

        if (this.listeners[event].includes(callback)) {
            throw new Error('Tried to add a listener that is already registered');
        }

        this.listeners[event].push({
            callback: callback,
            context: context
        });
    }

    // Unregister TelemetryCollection events.
    off(event, callback) {
        if (!this.listeners[event]) {
            throw new Error('Event not supported by Telemetry Collections: ' + event);
        }

        if (!this.listeners[event].includes(callback)) {
            throw new Error('Tried to remove a listener that does not exist');
        }

        this.listeners[event].remove(callback);
    }

    emit(event, payload) {
        if (!this.listeners[event].length) {
            return;
        }

        payload = [...payload];

        this.listeners[event].forEach((listener) => {
            if (listener.context) {
                listener.callback.apply(listener.context, payload);
            } else {
                listener.callback(payload);
            }
        });
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
        this.unsubscribeFromTimeSystem();
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

}
