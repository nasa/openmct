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

/**
 * Binds class methods
 */
function methods() {
    return [
        'load',
        'on',
        'off',
        'hasMorePages',
        'nextPage',
        'destroy',
        '_requestHistoricalTelemetry',
        '_initiateHistoricalRequests',
        '_initiateSubscriptionTelemetry',
        '_addPage',
        '_processNewTelemetry',
        '_bounds',
        '_timeSystem',
        '_reset',
        '_emit',
        '_watchBounds',
        '_unwatchBounds',
        '_watchTimeSystem',
        '_unwatchTimeSystem'
    ];
}

/** Class representing a Telemetry Collection. */

export class TelemetryCollection {
    /**
     * Creates a Telemetry Collection
     *
     * @param  {object} openmct - Openm MCT
     * @param  {object} domainObject - Domain Object to user for telemetry collection
     * @param  {object} options - Any options or args passed in from request/subscribe
     */
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

        this.collectionState = undefined;

        this.listeners = {
            add: [],
            remove: []
        };
    }
    /**
     * This will load start the requests for historical and realtime data,
     * as well as setting up initial values and watchers
     */
    load() {
        if (this.loaded) {
            throw new Error('Telemetry Collection has already been loaded.');
        }

        this._timeSystem(this.openmct.time.timeSystem());
        this.lastBounds = this.openmct.time.bounds();

        this._watchBounds();
        this._watchTimeSystem();

        this._initiateHistoricalRequests();
        this._initiateSubscriptionTelemetry();

        this.loaded = true;
    }

    /**
     * returns if there is more telemetry within the time bounds
     * if the provider supports it
     *
     * @returns {boolean}
     */
    hasMorePages() {
        return this.historicalProvider
            && this.historicalProvider.supportsPaging
            && this.historicalProvider.supportsPaging()
            && this.historicalProvider.hasMorePages
            && this.historicalProvider.hasMorePages(this);
    }

    /**
     * will trigger the next page for the provider if it supports it,
     * _addPage will be passed in as a callback to receive the telemetry and updated state
     */
    nextPage() {
        if (
            !this.historicalProvider
            || !this.historicalProvider.supportsPaging()
            || !this.historicalProvider.nextPage
        ) {
            throw new Error('Provider does not support paging');
        }

        this.historicalProvider.nextPage(this._addPage, this.collectionState);
    }

    /**
     * @param  {string} event - add, remove
     * @param  {requestCallback} callback - callback to be executed when event happens,
     * should accept an array of added telemetry data
     * @param  {object} [context] - optional context to use
     */
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

    /**
     * @param  {string} event - add, remove
     * @param  {requestCallback} callback - callback to be executed when event happens,
     * should accept an array of removed
     * telemetry data
     */
    off(event, callback) {
        if (!this.listeners[event]) {
            throw new Error('Event not supported by Telemetry Collections: ' + event);
        }

        if (!this.listeners[event].includes(callback)) {
            throw new Error('Tried to remove a listener that does not exist');
        }

        this.listeners[event].remove(callback);
    }

    /**
     * can/should be called by the requester of the telemetry collection
     * to remove any listeners
     */
    destroy() {
        this._unwatchBounds();
        this._unwatchTimeSystem();
        if (this.unsubscribe) {
            this.unsubscribe();
        }
    }

    /**
     * Sets up  the telemetry collection for historical requests,
     * this uses the "standardizeRequestOptions" from Telemetry API
     */
    _initiateHistoricalRequests() {
        if (this.arguments.length === 1) {
            this.arguments.length = 2;
            this.arguments[1] = {};
        }

        this.openmct.telemetry.standardizeRequestOptions(this.arguments[1]);
        this.historicalProvider = this.openmct.telemetry.findRequestProvider(this.domainObject, this.arguments);

        this._requestHistoricalTelemetry();
    }
    /**
     * If a historical provider exists, then historical requests will be made
     */
    async _requestHistoricalTelemetry() {
        if (!this.historicalProvider) {
            return;
        }

        let historicalData = await this.historicalProvider.request.apply(this.domainObject, this.arguments).catch((rejected) => {
            this.openmct.notifications.error('Error requesting telemetry data, see console for details');
            console.error(rejected);

            return Promise.reject(rejected);
        });

        if (Array.isArray(historicalData)) {
            this._processNewTelemetry(historicalData);
        }
    }
    /**
     * This uses the built in subscription function from Telemetry API
     */
    _initiateSubscriptionTelemetry() {
        this.unsubscribe = this.openmct.telemetry
            .subscribe(this.domainObject, (datum) => {
                this._processNewTelemetry(datum);
            }, this.arguments);
    }

    /**
     * Utilized by telemetry provider to add more data as well as
     * pass in the current state of the telemetry collection
     * (which the telemetry collection will hold)
     *
     *
     * @param  {Object[]} telemetryData - array of telemetry data objects
     * @param  {*} [collectionState] - providers can pass a collectionState that
     * will be used for tracking between collection and provider
     */
    _addPage(telemetryData, collectionState) {
        this.collectionState = collectionState;
        this._processNewTelemetry(telemetryData);
    }

    /**
     * Filter any new telemetry (add/page, historical, subscription) based on
     * time bounds
     *
     * @param  {(Object|Object[])} telemetryData - telemetry data object or
     * array of telemetry data objects
     */
    _processNewTelemetry(telemetryData) {
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
            this._emit('add', added);
        }
    }

    /**
     * when the start time, end time, or both have been updated.
     * data could be added OR removed here we update the current
     * bounded telemetry and emit the results
     *
     * @param  {TimeConductorBounds} bounds The newly updated bounds
     * @param  {boolean} [tick] `true` if the bounds update was due to
     * a "tick" event (ie. was an automatic update), false otherwise.
     */
    _bounds(bounds, isTick) {
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
                this._emit('remove', discarded);
            }

            if (added.length > 0) {
                this._emit('add', added);
            }

        } else {
            // user bounds change, reset
            this._reset();
        }

    }

    /**
     * Reset the telemetry data of the collection, and re-request
     * historical telemetry
     *
     * @todo handle subscriptions more granually
     */
    _reset() {
        this.boundedTelemetry = [];
        this.futureBuffer = [];

        this._requestHistoricalTelemetry();
        // possible unsubscribe/resubscribe...
    }

    /**
     * whenever the time system is updated need to update related values in
     * the Telemetry Collection and reset the telemetry collection
     *
     * @param  {TimeSystem} timeSystem - the value of the currently applied
     * Time System
     */
    _timeSystem(timeSystem) {
        this.timeKey = timeSystem.key;
        let metadataValue = this.metadata.value(this.timeKey) || { format: this.timeKey };
        let valueFormatter = this.openmct.telemetry.getValueFormatter(metadataValue);

        this.parseTime = (datum) => {
            return valueFormatter.parse(datum);
        };

        this._reset();
    }

    /**
     * will call all the listeners for the event type and pass in the payload
     *
     * @param  {string} event event type, 'add' or 'remove'
     * @param  {Object[]} payload array of telemetry objects
     */
    _emit(event, payload) {
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

    /**
     * adds the _bounds callback to the 'bounds' timeAPI listener
     */
    _watchBounds() {
        this.openmct.time.on('bounds', this._bounds);
    }

    /**
     * removes the _bounds callback from the 'bounds' timeAPI listener
     */
    _unwatchBounds() {
        this.openmct.time.off('bounds', this._bounds);
    }

    /**
     * adds the _timeSystem callback to the 'timeSystem' timeAPI listener
     */
    _watchTimeSystem() {
        this.openmct.time.on('timeSystem', this._timeSystem);
    }

    /**
     * removes the _timeSystem callback from the 'timeSystem' timeAPI listener
     */
    _unwatchTimeSystem() {
        this.openmct.time.off('timeSystem', this._timeSystem);
    }
}
