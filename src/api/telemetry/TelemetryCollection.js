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

/** Class representing a Telemetry Collection. */

export class TelemetryCollection extends EventEmitter {
    /**
     * Creates a Telemetry Collection
     *
     * @param  {object} openmct - Openm MCT
     * @param  {object} domainObject - Domain Object to user for telemetry collection
     * @param  {object} options - Any options passed in for request/subscribe
     */
    constructor(openmct, domainObject, options) {
        super();

        this.loaded = false;
        this.openmct = openmct;
        this.domainObject = domainObject;

        this.boundedTelemetry = [];
        this.futureBuffer = [];

        this.parseTime = undefined;
        this.metadata = this.openmct.telemetry.getMetadata(domainObject);

        this.unsubscribe = undefined;
        this.historicalProvider = undefined;

        this.options = options;

        this.pageState = undefined;

        this.lastBounds = undefined;
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
        this.openmct.telemetry.standardizeRequestOptions(this.options);
        this.historicalProvider = this.openmct.telemetry.
            findRequestProvider(this.domainObject, this.options);

        this._requestHistoricalTelemetry();
    }
    /**
     * If a historical provider exists, then historical requests will be made
     */
    async _requestHistoricalTelemetry() {
        if (!this.historicalProvider) {
            return;
        }

        let historicalData;

        try {
            historicalData = await this.historicalProvider.request(this.domainObject, this.options);
        } catch (error) {
            console.error('Error requesting telemetry data...');
            throw new Error(error);
        }

        this._processNewTelemetry(historicalData);

    }
    /**
     * This uses the built in subscription function from Telemetry API
     */
    _initiateSubscriptionTelemetry() {

        if (this.unsubscribe) {
            this.unsubscribe();
        }

        this.unsubscribe = this.openmct.telemetry
            .subscribe(this.domainObject, (datum) => {
                this._processNewTelemetry(datum);
            }, this.options);
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
            this.emit('add', added);
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
                this.emit('remove', discarded);
            }

            if (added.length > 0) {
                this.emit('add', added);
            }

        } else {
            // user bounds change, reset
            this._reset();
        }

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
     * Reset the telemetry data of the collection, and re-request
     * historical telemetry
     *
     * @param  {boolean} skipRequest - skip requesting history, default false
     *
     * @todo handle subscriptions more granually
     */
    _reset(skipRequest = false) {
        this.boundedTelemetry = [];
        this.futureBuffer = [];

        if (skipRequest) {
            return;
        }

        this._requestHistoricalTelemetry();
        // possible unsubscribe/resubscribe...
    }

    /**
     * adds the _bounds callback to the 'bounds' timeAPI listener
     */
    _watchBounds() {
        this.openmct.time.on('bounds', this._bounds, this);
    }

    /**
     * removes the _bounds callback from the 'bounds' timeAPI listener
     */
    _unwatchBounds() {
        this.openmct.time.off('bounds', this._bounds, this);
    }

    /**
     * adds the _timeSystem callback to the 'timeSystem' timeAPI listener
     */
    _watchTimeSystem() {
        this.openmct.time.on('timeSystem', this._timeSystem, this);
    }

    /**
     * removes the _timeSystem callback from the 'timeSystem' timeAPI listener
     */
    _unwatchTimeSystem() {
        this.openmct.time.off('timeSystem', this._timeSystem, this);
    }
}
