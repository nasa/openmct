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

function bindUs() {
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

    constructor(openmct, domainObject, historicalProvider, options) {
        bindUs().forEach(method => this[method] = this[method].bind(this));

        this.loaded = false;
        this.loadBuffer = [];

        this.openmct = openmct;
        this.domainObject = domainObject;

        this.boundedTelemetry = [];
        this.futureBuffer = [];

        this.parseTime = undefined;
        this.metadata = this.openmct.telemetry.getMetadata(domainObject);

        this.timeSystem(openmct.time.timeSystem());
        this.lastBounds = openmct.time.bounds();

        this.unsubscribe = undefined;
        this.historicalProvider = historicalProvider;

        this.arguments = options;

        this.listeners = {
            add: [],
            remove: []
        };

        this.requestHistoricalTelemetry();
        this.initiateSubscriptionTelemetry();

        this.watchBounds();
        this.watchTimeSystem();
    }

    load() {
        this.loaded = true;

        if (this.loadBuffer.length) {
            this.emit('add', this.loadBuffer);
        }

        delete this.loadBuffer;
    }

    async requestHistoricalTelemetry() {
        if (!this.historicalProvider) {
            return;
        }

        // remove for reset
        // question: do we need to emit it? It's not out of bounds, it's just old
        if (this.boundedTelemetry.length !== 0) {
            this.emit('remove', this.boundedTelemetry);
            this.boundedTelemetry = [];
        }

        let historicalData = await this.historicalProvider.request.apply(this.domainObject, this.arguments).catch((rejected) => {
            this.openmct.notifications.error('Error requesting telemetry data, see console for details');
            console.error(rejected);

            return Promise.reject(rejected);
        });

        if (Array.isArray(historicalData)) {
            // store until loaded, unless loaded
            if (this.loaded) {
                this.processNewTelemetry(historicalData);
            } else {
                this.loadBuffer = historicalData;
            }
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
                startIndex = _.sortedIndex(this.boundedTelemetry, testDatum);
                discarded = this.boundedTelemetry.splice(0, startIndex);
            }

            if (endChanged) {
                testDatum[this.timeKey] = bounds.end;
                // Calculate the new index of the last item in bounds
                endIndex = _.sortedLastIndex(this.futureBuffer, testDatum);
                added = this.futureBuffer.splice(0, endIndex);
                this.boundedTelemetry = [...this.boundedTelemetry, ...added];
            }

            if (discarded.length > 0) {
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
        if (!this.loaded) {
            return;
        }

        if (this.boundedTelemetry.length) {
            this.emit('remove', this.boundedTelemetry);

            this.boundedTelemetry = [];
            this.futureBuffer = [];
        }

        this.requestHistoricalTelemetry();
    }

    timeSystem(timeSystem) {
        let timeKey = timeSystem.key;
        let metadataValue = this.metadata.value(timeKey) || { format: timeKey };
        let valueFormatter = this.openmct.telemetry.getValueFormatter(metadataValue);

        this.parseTime = (datum) => {
            return valueFormatter.parse(datum);
        };
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
