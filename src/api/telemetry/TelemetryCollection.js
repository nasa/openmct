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

function methods() {
    return [
        'load',
        'requestHistoricalTelemetry',
        'initiateSubscriptionTelemetry',
        'addPage',
        'processNewTelemetry',
        'hasMorePages',
        'nextPage',
        'bounds',
        'timeSystem',
        'reset',
        'on',
        'off',
        'emit',
        'watchBounds',
        'unwatchBounds',
        'watchTimeSystem',
        'unwatchTimeSystem',
        'destroy'
    ];
}

export class TelemetryCollection {

    constructor(openmct, domainObject, options) {
        methods().forEach(method => this[method] = this[method].bind(this));

        this.loaded = false;
        this.openmct = openmct;
        this.domainObject = domainObject;

        this.boundedTelemetry = [];
        this.futureBuffer = [];

        this.parseTime = undefined;
        this.metadata = this.openmct.telemetry.getMetadata(domainObject);

        this.unsubscribe = undefined;
        this.historicalProvider = undefined;

        this.arguments = options;

        this.listeners = {
            add: [],
            remove: []
        };
    }

    load() {
        if (this.loaded) {
            throw new Error('Telemetry Collection has already been loaded.');
        }

        this.timeSystem(this.openmct.time.timeSystem());
        this.lastBounds = this.openmct.time.bounds();

        this.watchBounds();
        this.watchTimeSystem();

        this.initiateHistoricalRequests();
        this.initiateSubscriptionTelemetry();

        this.loaded = true;
    }

    initiateHistoricalRequests() {
        if (this.arguments.length === 1) {
            this.arguments.length = 2;
            this.arguments[1] = {};
        }

        this.openmct.telemetry.standardizeRequestOptions(this.arguments[1]);
        this.historicalProvider = this.openmct.telemetry.findRequestProvider(this.domainObject, this.arguments);

        this.requestHistoricalTelemetry();
    }

    async requestHistoricalTelemetry() {
        if (!this.historicalProvider) {
            return;
        }

        let historicalData = await this.historicalProvider.request.apply(this.domainObject, this.arguments).catch((rejected) => {
            this.openmct.notifications.error('Error requesting telemetry data, see console for details');
            console.error(rejected);

            return Promise.reject(rejected);
        });

        if (Array.isArray(historicalData)) {
            this.processNewTelemetry(historicalData);
        }
    }

    initiateSubscriptionTelemetry() {
        this.unsubscribe = this.openmct.telemetry
            .subscribe(this.domainObject, (datum) => {
                this.processNewTelemetry(datum);
            }, this.arguments);
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
            && this.historicalProvider.supportsPaging && this.historicalProvider.supportsPaging()
            && this.historicalProvider.hasMorePages(this);
    }

    // will return the next "page" of telemetry if the provider supports it
    nextPage() {
        if (!this.historicalProvider || !this.historicalProvider.supportsPaging()) { // add check for paging method
            throw new Error('Provider does not support paging');
        }

        this.historicalProvider.nextPage(this.arguments, this);
    }

    // either user changes bounds or incremental tick
    // when bounds change, data could be added OR removed
    // here we update the current bounded telemetry and emit the results
    bounds(bounds, isTick) {
        let startChanged = this.lastBounds.start !== bounds.start;
        let endChanged = this.lastBounds.end !== bounds.end;

        this.lastBounds = bounds;

        if (isTick) {
            // need to check futureBuffer and need to check
            // if anything has fallen out of bounds
            let startIndex = 0;
            let endIndex = 0;

            let discarded = [];
            let added = [];
            let testDatum = {};

            if (startChanged) {
                testDatum[this.timeKey] = bounds.start;
                // Calculate the new index of the first item within the bounds
                startIndex = _.sortedIndexBy(this.boundedTelemetry, testDatum, datum => this.parseTime(datum));
                discarded = this.boundedTelemetry.splice(0, startIndex);
            }

            if (endChanged) {
                testDatum[this.timeKey] = bounds.end;
                // Calculate the new index of the last item in bounds
                endIndex = _.sortedLastIndexBy(this.futureBuffer, testDatum, datum => this.parseTime(datum));
                added = this.futureBuffer.splice(0, endIndex);
                this.boundedTelemetry = [...this.boundedTelemetry, ...added];
            }

            if (discarded.length > 0) {
                console.log('discarded has length remove');
                this.emit('remove', discarded);
            }

            if (added.length > 0) {
                this.emit('add', added);
            }

        } else {
            // user bounds change, reset
            this.reset();
        }

    }

    reset() {
        this.boundedTelemetry = [];
        this.futureBuffer = [];

        this.requestHistoricalTelemetry();
    }

    timeSystem(timeSystem) {
        this.timeKey = timeSystem.key;
        let metadataValue = this.metadata.value(this.timeKey) || { format: this.timeKey };
        let valueFormatter = this.openmct.telemetry.getValueFormatter(metadataValue);

        this.parseTime = (datum) => {
            return valueFormatter.parse(datum);
        };

        this.reset();
    }

    on(event, callback, context) {
        if (!this.listeners[event]) {
            throw new Error('Event not supported by Telemetry Collections: ' + event);
        }

        if (this.listeners[event].includes(callback)) {
            throw new Error('Tried to add a listener that is already registered');
        }

        this.listeners[event].push({
            callback,
            context
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

    watchBounds() {
        this.openmct.time.on('bounds', this.bounds);
    }

    unwatchBounds() {
        this.openmct.time.off('bounds', this.bounds);
    }

    watchTimeSystem() {
        this.openmct.time.on('timeSystem', this.timeSystem);
    }

    unwatchTimeSystem() {
        this.openmct.time.off('timeSystem', this.timeSystem);
    }

    destroy() {
        this.unwatchBounds();
        this.unwatchTimeSystem();
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

}
