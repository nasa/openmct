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

const ERRORS = {
    TIMESYSTEM_KEY: 'All telemetry metadata must have a telemetry value with a key that matches the key of the active time system.',
    LOADED: 'Telemetry Collection has already been loaded.'
};

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
        this.requestAbort = undefined;
    }

    /**
     * This will start the requests for historical and realtime data,
     * as well as setting up initial values and watchers
     */
    load() {
        if (this.loaded) {
            this._error(ERRORS.LOADED);
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
     * can/should be called by the requester of the telemetry collection
     * to remove any listeners
     */
    destroy() {
        if (this.requestAbort) {
            this.requestAbort.abort();
        }

        this._unwatchBounds();
        this._unwatchTimeSystem();
        if (this.unsubscribe) {
            this.unsubscribe();
        }

        this.removeAllListeners();
    }

    /**
     * This will start the requests for historical and realtime data,
     * as well as setting up initial values and watchers
     */
    getAll() {
        return this.boundedTelemetry;
    }

    /**
     * Sets up  the telemetry collection for historical requests,
     * this uses the "standardizeRequestOptions" from Telemetry API
     * @private
     */
    _initiateHistoricalRequests() {
        this.openmct.telemetry.standardizeRequestOptions(this.options);
        this.historicalProvider = this.openmct.telemetry.
            findRequestProvider(this.domainObject, this.options);

        this._requestHistoricalTelemetry();
    }
    /**
     * If a historical provider exists, then historical requests will be made
     * @private
     */
    async _requestHistoricalTelemetry() {
        if (!this.historicalProvider) {
            return;
        }

        let historicalData;

        try {
            this.requestAbort = new AbortController();
            this.options.signal = this.requestAbort.signal;
            historicalData = await this.historicalProvider.request(this.domainObject, this.options);
            this.requestAbort = undefined;
        } catch (error) {
            console.error('Error requesting telemetry data...');
            this.requestAbort = undefined;
            this._error(error);
        }

        this._processNewTelemetry(historicalData);

    }
    /**
     * This uses the built in subscription function from Telemetry API
     * @private
     */
    _initiateSubscriptionTelemetry() {

        if (this.unsubscribe) {
            this.unsubscribe();
        }

        this.unsubscribe = this.openmct.telemetry
            .subscribe(
                this.domainObject,
                datum => this._processNewTelemetry(datum),
                this.options
            );
    }

    /**
     * Filter any new telemetry (add/page, historical, subscription) based on
     * time bounds and dupes
     *
     * @param  {(Object|Object[])} telemetryData - telemetry data object or
     * array of telemetry data objects
     * @private
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
                let isDuplicate = false;
                let startIndex = this._sortedIndex(datum);
                let endIndex = undefined;

                // dupe check
                if (startIndex !== this.boundedTelemetry.length) {
                    endIndex = _.sortedLastIndexBy(
                        this.boundedTelemetry,
                        datum,
                        boundedDatum => this.parseTime(boundedDatum)
                    );

                    if (endIndex > startIndex) {
                        let potentialDupes = this.boundedTelemetry.slice(startIndex, endIndex);

                        isDuplicate = potentialDupes.some(_.isEqual.bind(undefined, datum));
                    }
                }

                if (!isDuplicate) {
                    let index = endIndex || startIndex;

                    this.boundedTelemetry.splice(index, 0, datum);
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
     * Finds the correct insertion point for the given telemetry datum.
     * Leverages lodash's `sortedIndexBy` function which implements a binary search.
     * @private
     */
    _sortedIndex(datum) {
        if (this.boundedTelemetry.length === 0) {
            return 0;
        }

        let parsedValue = this.parseTime(datum);
        let lastValue = this.parseTime(this.boundedTelemetry[this.boundedTelemetry.length - 1]);

        if (parsedValue > lastValue || parsedValue === lastValue) {
            return this.boundedTelemetry.length;
        } else {
            return _.sortedIndexBy(
                this.boundedTelemetry,
                datum,
                boundedDatum => this.parseTime(boundedDatum)
            );
        }
    }

    /**
     * when the start time, end time, or both have been updated.
     * data could be added OR removed here we update the current
     * bounded telemetry
     *
     * @param  {TimeConductorBounds} bounds The newly updated bounds
     * @param  {boolean} [tick] `true` if the bounds update was due to
     * a "tick" event (ie. was an automatic update), false otherwise.
     * @private
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
                startIndex = _.sortedIndexBy(
                    this.boundedTelemetry,
                    testDatum,
                    datum => this.parseTime(datum)
                );
                discarded = this.boundedTelemetry.splice(0, startIndex);
            }

            if (endChanged) {
                testDatum[this.timeKey] = bounds.end;
                // Calculate the new index of the last item in bounds
                endIndex = _.sortedLastIndexBy(
                    this.futureBuffer,
                    testDatum,
                    datum => this.parseTime(datum)
                );
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
     * @private
     */
    _timeSystem(timeSystem) {
        let domains = this.metadata.valuesForHints(['domain']);
        let domain = domains.find((d) => d.key === timeSystem.key);

        if (domain === undefined) {
            this._error(ERRORS.TIMESYSTEM_KEY);
        }

        // timeKey is used to create a dummy datum used for sorting
        this.timeKey = domain.source; // this defaults to key if no source is set
        let metadataValue = this.metadata.value(timeSystem.key) || { format: timeSystem.key };
        let valueFormatter = this.openmct.telemetry.getValueFormatter(metadataValue);

        this.parseTime = (datum) => {
            return valueFormatter.parse(datum);
        };

        this._reset();
    }

    /**
     * Reset the telemetry data of the collection, and re-request
     * historical telemetry
     * @private
     *
     * @todo handle subscriptions more granually
     */
    _reset() {
        this.boundedTelemetry = [];
        this.futureBuffer = [];

        this._requestHistoricalTelemetry();
    }

    /**
     * adds the _bounds callback to the 'bounds' timeAPI listener
     * @private
     */
    _watchBounds() {
        this.openmct.time.on('bounds', this._bounds, this);
    }

    /**
     * removes the _bounds callback from the 'bounds' timeAPI listener
     * @private
     */
    _unwatchBounds() {
        this.openmct.time.off('bounds', this._bounds, this);
    }

    /**
     * adds the _timeSystem callback to the 'timeSystem' timeAPI listener
     * @private
     */
    _watchTimeSystem() {
        this.openmct.time.on('timeSystem', this._timeSystem, this);
    }

    /**
     * removes the _timeSystem callback from the 'timeSystem' timeAPI listener
     * @private
     */
    _unwatchTimeSystem() {
        this.openmct.time.off('timeSystem', this._timeSystem, this);
    }

    /**
     * will throw a new Error, for passed in message
     * @param  {string} message Message describing the error
     * @private
     */
    _error(message) {
        throw new Error(message);
    }
}
