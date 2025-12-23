/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2025, United States Government
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

/**
 * @implements {import('src/api/telemetry/TelemetryAPI').StalenessProvider}
 */
export default class ExampleStalenessProvider {
  #intervalId;
  constructor(openmct, config = { stalenessInterval: 7000, reportStalenessInterval: 300 }) {
    this.openmct = openmct;
    this.stalenessInterval = config.stalenessInterval;
    this.reportStalenessInterval = config.reportStalenessInterval;

    this.observingStaleness = {};
    this.latestReceivedTelemetry = {};

    this.timeSystem = this.openmct.time.getTimeSystem();
    this.#observeTimeSystem();
    this.#observeStaleness();
  }

  #observeTimeSystem() {
    this.openmct.time.on('timeSystemChanged', () => {
      this.timeSystemKey = this.openmct.time.getTimeSystem().key;
    });
  }

  supportsStaleness(domainObject) {
    return this.openmct.telemetry.isTelemetryObject(domainObject);
  }

  subscribeToStaleness(domainObject, callback) {
    const keyString = this.openmct.objects.makeKeyString(domainObject.identifier);

    const stalenessResponseObject = {
      isStale: false
    };
    if (this.timeSystemKey) {
      stalenessResponseObject[this.timeSystemKey] = this.openmct.time.now();
    }
    this.observingStaleness[keyString] = {
      response: stalenessResponseObject,
      callback
    };

    const unsubscribe = this.openmct.telemetry.subscribe(domainObject, (datum) => {
      this.#updateLatestReceivedTelemetry(domainObject, datum);
    });

    return () => {
      delete this.observingStaleness[keyString];
      unsubscribe?.();
      if (Object.keys(this.observingStaleness).length === 0) {
        clearInterval(this.#intervalId);
      }
    };
  }

  #observeStaleness() {
    this.#intervalId = setInterval(() => {
      Object.entries(this.observingStaleness).forEach(([keyString, observer]) => {
        const now = this.openmct.time.now();
        const isStale = now - this.latestReceivedTelemetry[keyString] > this.stalenessInterval;

        if (isStale !== observer.response.isStale) {
          const stalenessResponseObject = {
            isStale
          };
          stalenessResponseObject[this.timeSystemKey] = now;

          this.observingStaleness[keyString].response = stalenessResponseObject;
          this.observingStaleness[keyString].callback(stalenessResponseObject);
        }
      });
    }, this.reportStalenessInterval);
  }

  /**
   * @param {*} domainObject
   * @returns {import('src/api/telemetry/TelemetryAPI').StalenessResponseObject}
   */
  async isStale(domainObject) {
    const keyString = this.openmct.objects.makeKeyString(domainObject.identifier);

    if (this.observingStaleness[keyString] === undefined) {
      // Naively assumes sorted request response so uses last datum in array
      const response = await this.openmct.telemetry.request(domainObject, { strategy: 'latest' });
      const lastDatum = response?.length ? response[response.length - 1] : undefined;
      this.#updateLatestReceivedTelemetry(domainObject, lastDatum);
    }

    const timestamp = this.latestReceivedTelemetry[keyString];
    if (timestamp) {
      const isStale = this.openmct.time.now() - timestamp > this.stalenessInterval;

      const stalenessResponseObject = { isStale };
      stalenessResponseObject[this.timeSystemKey] = timestamp;

      return stalenessResponseObject;
    }
  }

  #updateLatestReceivedTelemetry(domainObject, datum) {
    const keyString = this.openmct.objects.makeKeyString(domainObject.identifier);
    const metadata = this.openmct.telemetry.getMetadata(domainObject);
    const metadataValue = metadata.value(this.timeSystemKey) || { format: this.timeSystemKey };
    const valueFormatter = this.openmct.telemetry.getValueFormatter(metadataValue);

    const timestamp = valueFormatter.parse(datum);
    this.latestReceivedTelemetry[keyString] = timestamp;
  }
}
