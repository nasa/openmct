/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
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
import { LOADED_ERROR, TIMESYSTEM_KEY_NOTIFICATION, TIMESYSTEM_KEY_WARNING } from './constants';
import { TIME_CONTEXT_EVENTS } from '../time/constants';

/**
 * @typedef {import('../objects/ObjectAPI').DomainObject} DomainObject
 */

/**
 * @typedef {import('../time/TimeContext').TimeContext} TimeContext
 */

/**
 * @typedef {import('./TelemetryAPI').TelemetryRequestOptions} TelemetryRequestOptions
 */

/**
 * @typedef {import('../../../openmct').OpenMCT} OpenMCT
 */

/** Class representing a Telemetry Collection. */

export default class TelemetryCollection extends EventEmitter {
  /**
   * Creates a Telemetry Collection
   *
   * @param  {OpenMCT} openmct - Open MCT
   * @param  {DomainObject} domainObject - Domain Object to use for telemetry collection
   * @param  {TelemetryRequestOptions} options - Any options passed in for request/subscribe
   */
  constructor(openmct, domainObject, options = {}) {
    super();

    this.loaded = false;
    this.openmct = openmct;
    this.domainObject = domainObject;
    this.boundedTelemetry = [];
    this.futureBuffer = [];
    this.parseTime = undefined;
    this.metadata = this.openmct.telemetry.getMetadata(domainObject);
    if (!Object.hasOwn(options, 'timeContext')) {
      options.timeContext = this.openmct.time;
    }
    this.options = options;
    this.unsubscribe = undefined;
    this.pageState = undefined;
    this.lastBounds = undefined;
    this.requestAbort = undefined;
    this.isStrategyLatest = this.options.strategy === 'latest';
    this.dataOutsideTimeBounds = false;
  }

  /**
   * This will start the requests for historical and realtime data,
   * as well as setting up initial values and watchers
   */
  load() {
    if (this.loaded) {
      this._error(LOADED_ERROR);
    }

    this._setTimeSystem(this.options.timeContext.getTimeSystem());
    this.lastBounds = this.options.timeContext.getBounds();
    this._watchBounds();
    this._watchTimeSystem();
    this._watchTimeModeChange();

    this._requestHistoricalTelemetry();
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
    this._unwatchTimeModeChange();
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
   * If a historical provider exists, then historical requests will be made
   * @private
   */
  async _requestHistoricalTelemetry() {
    let options = this.openmct.telemetry.standardizeRequestOptions({ ...this.options });
    const historicalProvider = this.openmct.telemetry.findRequestProvider(
      this.domainObject,
      options
    );

    if (!historicalProvider) {
      return;
    }

    let historicalData;

    options.onPartialResponse = this._processNewTelemetry.bind(this);

    try {
      if (this.requestAbort) {
        this.requestAbort.abort();
      }

      this.requestAbort = new AbortController();
      options.signal = this.requestAbort.signal;
      this.emit('requestStarted');
      const modifiedOptions = await this.openmct.telemetry.applyRequestInterceptors(
        this.domainObject,
        options
      );
      historicalData = await historicalProvider.request(this.domainObject, modifiedOptions);
    } catch (error) {
      if (error.name !== 'AbortError') {
        console.error('Error requesting telemetry data...');
        this._error(error);
      }
    }

    this.emit('requestEnded');
    this.requestAbort = undefined;

    if (!historicalData || !historicalData.length) {
      return;
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

    this.unsubscribe = this.openmct.telemetry.subscribe(
      this.domainObject,
      (datum) => this._processNewTelemetry(datum),
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
    if (telemetryData === undefined) {
      return;
    }

    let latestBoundedDatum = this.boundedTelemetry[this.boundedTelemetry.length - 1];
    let data = Array.isArray(telemetryData) ? telemetryData : [telemetryData];
    let parsedValue;
    let beforeStartOfBounds;
    let afterEndOfBounds;
    let added = [];
    let addedIndices = [];
    let hasDataBeforeStartBound = false;

    // loop through, sort and dedupe
    for (let datum of data) {
      parsedValue = this.parseTime(datum);
      beforeStartOfBounds = parsedValue < this.lastBounds.start;
      afterEndOfBounds = parsedValue > this.lastBounds.end;

      if (
        !afterEndOfBounds &&
        (!beforeStartOfBounds || (this.isStrategyLatest && this.openmct.telemetry.greedyLAD()))
      ) {
        let isDuplicate = false;
        let startIndex = this._sortedIndex(datum);
        let endIndex = undefined;

        // dupe check
        if (startIndex !== this.boundedTelemetry.length) {
          endIndex = _.sortedLastIndexBy(this.boundedTelemetry, datum, (boundedDatum) =>
            this.parseTime(boundedDatum)
          );

          if (endIndex > startIndex) {
            let potentialDupes = this.boundedTelemetry.slice(startIndex, endIndex);
            isDuplicate = potentialDupes.some(_.isEqual.bind(undefined, datum));
          }
        } else if (startIndex === this.boundedTelemetry.length) {
          isDuplicate = _.isEqual(datum, this.boundedTelemetry[this.boundedTelemetry.length - 1]);
        }

        if (!isDuplicate) {
          let index = endIndex || startIndex;

          this.boundedTelemetry.splice(index, 0, datum);
          addedIndices.push(index);
          added.push(datum);

          if (!hasDataBeforeStartBound && beforeStartOfBounds) {
            hasDataBeforeStartBound = true;
          }
        }
      } else if (afterEndOfBounds) {
        this.futureBuffer.push(datum);
      }
    }

    if (added.length) {
      // if latest strategy is requested, we need to check if the value is the latest unemitted value
      if (this.isStrategyLatest) {
        this.boundedTelemetry = [this.boundedTelemetry[this.boundedTelemetry.length - 1]];

        // if true, then this value has yet to be emitted
        if (this.boundedTelemetry[0] !== latestBoundedDatum) {
          if (hasDataBeforeStartBound) {
            this._handleDataOutsideBounds();
          } else {
            this._handleDataInsideBounds();
          }

          this.emit('add', this.boundedTelemetry);
        }
      } else {
        this.emit('add', added, addedIndices);
      }
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
      return _.sortedIndexBy(this.boundedTelemetry, datum, (boundedDatum) =>
        this.parseTime(boundedDatum)
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
      if (this.timeKey === undefined) {
        return;
      }

      // need to check futureBuffer and need to check
      // if anything has fallen out of bounds
      let startIndex = 0;
      let endIndex = 0;

      let discarded = [];
      let added = [];
      let testDatum = {};

      if (endChanged) {
        testDatum[this.timeKey] = bounds.end;
        // Calculate the new index of the last item in bounds
        endIndex = _.sortedLastIndexBy(this.futureBuffer, testDatum, (datum) =>
          this.parseTime(datum)
        );
        added = this.futureBuffer.splice(0, endIndex);
      }

      if (startChanged) {
        testDatum[this.timeKey] = bounds.start;

        // a little more complicated if not latest strategy
        if (!this.isStrategyLatest) {
          // Calculate the new index of the first item within the bounds
          startIndex = _.sortedIndexBy(this.boundedTelemetry, testDatum, (datum) =>
            this.parseTime(datum)
          );
          discarded = this.boundedTelemetry.splice(0, startIndex);
        } else if (this.parseTime(testDatum) > this.parseTime(this.boundedTelemetry[0])) {
          // if greedyLAD is active and there is no new data to replace, don't discard
          const isGreedyLAD = this.openmct.telemetry.greedyLAD();
          const shouldRemove = !isGreedyLAD || (isGreedyLAD && added.length > 0);

          if (shouldRemove) {
            discarded = this.boundedTelemetry;
            this.boundedTelemetry = [];
            // since it IS strategy latest, we can assume there will be at least 1 datum
            // unless no data was returned in the first request, we need to account for that
          } else if (this.boundedTelemetry.length === 1) {
            this._handleDataOutsideBounds();
          }
        }
      }

      if (discarded.length > 0) {
        this.emit('remove', discarded);
      }

      if (added.length > 0) {
        if (!this.isStrategyLatest) {
          this.boundedTelemetry = [...this.boundedTelemetry, ...added];
        } else {
          this._handleDataInsideBounds();

          added = [added[added.length - 1]];
          this.boundedTelemetry = added;
        }

        // Assumption is that added will be of length 1 here, so just send the last index of the boundedTelemetry in the add event
        this.emit('add', added, [this.boundedTelemetry.length]);
      }
    } else {
      // user bounds change, reset
      this._reset();
    }
  }

  _handleDataInsideBounds() {
    if (this.dataOutsideTimeBounds) {
      this.dataOutsideTimeBounds = false;
      this.emit('dataInsideTimeBounds');
    }
  }

  _handleDataOutsideBounds() {
    if (!this.dataOutsideTimeBounds) {
      this.dataOutsideTimeBounds = true;
      this.emit('dataOutsideTimeBounds');
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
  _setTimeSystem(timeSystem) {
    let domains = [];
    let metadataValue = { format: timeSystem.key };

    if (this.metadata) {
      domains = this.metadata.valuesForHints(['domain']);
      metadataValue = this.metadata.value(timeSystem.key) || { format: timeSystem.key };
    }

    let domain = domains.find((d) => d.key === timeSystem.key);

    if (domain !== undefined) {
      // timeKey is used to create a dummy datum used for sorting
      this.timeKey = domain.source;
    } else {
      this.timeKey = undefined;

      this._warn(TIMESYSTEM_KEY_WARNING);
      this.openmct.notifications.alert(TIMESYSTEM_KEY_NOTIFICATION);
    }

    let valueFormatter = this.openmct.telemetry.getValueFormatter(metadataValue);

    this.parseTime = (datum) => {
      return valueFormatter.parse(datum);
    };
  }

  _setTimeSystemAndFetchData(timeSystem) {
    this._setTimeSystem(timeSystem);
    this._reset();
  }

  _timeModeChanged() {
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

    this.emit('clear');

    this._requestHistoricalTelemetry();
  }

  /**
   * adds the _bounds callback to the 'boundsChanged' timeAPI listener
   * @private
   */
  _watchBounds() {
    this.options.timeContext.on(TIME_CONTEXT_EVENTS.boundsChanged, this._bounds, this);
  }

  /**
   * removes the _bounds callback from the 'boundsChanged' timeAPI listener
   * @private
   */
  _unwatchBounds() {
    this.options.timeContext.off(TIME_CONTEXT_EVENTS.boundsChanged, this._bounds, this);
  }

  /**
   * adds the _timeModeChanged callback to the 'modeChanged' timeAPI listener
   * @private
   */
  _watchTimeModeChange() {
    this.options.timeContext.on(TIME_CONTEXT_EVENTS.modeChanged, this._timeModeChanged, this);
  }

  /**
   * removes the _timeModeChanged callback from the 'modeChanged' timeAPI listener
   * @private
   */
  _unwatchTimeModeChange() {
    this.options.timeContext.off(TIME_CONTEXT_EVENTS.modeChanged, this._timeModeChanged, this);
  }

  /**
   * adds the _setTimeSystemAndFetchData callback to the 'timeSystem' timeAPI listener
   * @private
   */
  _watchTimeSystem() {
    this.options.timeContext.on(
      TIME_CONTEXT_EVENTS.timeSystemChanged,
      this._setTimeSystemAndFetchData,
      this
    );
  }

  /**
   * removes the _setTimeSystemAndFetchData callback from the 'timeSystem' timeAPI listener
   * @private
   */
  _unwatchTimeSystem() {
    this.options.timeContext.off(
      TIME_CONTEXT_EVENTS.timeSystemChanged,
      this._setTimeSystemAndFetchData,
      this
    );
  }

  /**
   * will throw a new Error, for passed in message
   * @param  {string} message Message describing the error
   * @private
   */
  _error(message) {
    throw new Error(message);
  }

  _warn(message) {
    console.warn(message);
  }
}
