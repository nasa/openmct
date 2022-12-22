/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2022, United States Government
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

function copyRelatedMetadata(metadata) {
    let compare = metadata.comparisonFunction;
    let copiedMetadata = JSON.parse(JSON.stringify(metadata));
    copiedMetadata.comparisonFunction = compare;

    return copiedMetadata;
}

export default class RelatedTelemetry {

    constructor(openmct, domainObject, telemetryKeys) {
        this._openmct = openmct;
        this._domainObject = domainObject;

        let metadata = this._openmct.telemetry.getMetadata(this._domainObject);
        let imageHints = metadata.valuesForHints(['image'])[0];

        this.hasRelatedTelemetry = imageHints.relatedTelemetry !== undefined;

        if (this.hasRelatedTelemetry) {
            this.keys = telemetryKeys;

            this._timeFormatter = undefined;
            this._timeSystemChange(this._openmct.time.timeSystem());

            // grab related telemetry metadata
            for (let key of this.keys) {
                if (imageHints.relatedTelemetry[key]) {
                    this[key] = copyRelatedMetadata(imageHints.relatedTelemetry[key]);
                }
            }

            this.load = this.load.bind(this);
            this._parseTime = this._parseTime.bind(this);
            this._timeSystemChange = this._timeSystemChange.bind(this);
            this.destroy = this.destroy.bind(this);

            this._openmct.time.on('timeSystem', this._timeSystemChange);
        }
    }

    async load() {
        if (!this.hasRelatedTelemetry) {
            throw new Error('This domain object does not have related telemetry, use "hasRelatedTelemetry" to check before loading.');
        }

        await Promise.all(
            this.keys.map(async (key) => {
                if (this[key]) {
                    const telemetryObjectId = this[key]?.historical?.telemetryObjectId || this[key]?.realtime?.telemetryObjectId;
                    if (telemetryObjectId) {
                        this[key].domainObject = await this._openmct.objects.get(telemetryObjectId);
                        this[key].telemetryCollection = this._openmct.telemetry.requestCollection(this[key].domainObject);

                        return this._initializeTelemetry(key);
                    }
                }
            })
        );
    }

    async _initializeTelemetry(key) {
        if (!this[key]?.telemetryCollection) {
            return;
        }

        this[key].telemetryCollection.load();
        await this._initializeHistorical(key);
        await this._intializeRealtime(key);
    }

    async _initializeHistorical(key) {
        if (!this[key].historical.telemetryObjectId) {
            this[key].historical.hasTelemetryOnDatum = true;
        } else if (this[key].historical.telemetryObjectId !== '') {
            this[key].historicalDomainObject = await this._openmct.objects.get(this[key].historical.telemetryObjectId);

            this[key].requestLatestFor = (targetDatum) => {
                const results = this[key].telemetryCollection.getAll().filter((datum) => {
                    return this._parseTime(datum) <= this._parseTime(targetDatum);
                });

                return results[results.length - 1];
            };
        }
    }

    async _intializeRealtime(key) {
        this[key].realtimeDomainObject = await this._openmct.objects.get(this[key].realtime.telemetryObjectId);
        this[key].listeners = [];
        this[key].subscribe = (callback) => {

            if (!this[key].isSubscribed) {
                this._subscribeToDataForKey(key);
            }

            if (!this[key].listeners.includes(callback)) {
                this[key].listeners.push(callback);

                return () => {
                    this[key].listeners.remove(callback);
                };
            } else {
                return () => {};
            }
        };
    }

    _subscribeToDataForKey(key) {
        if (this[key].isSubscribed) {
            return;
        }

        if (this[key].realtimeDomainObject && this[key].telemetryCollection) {
            this[key].telemetryCollection.on('add', (data) => {
                const latestDatum = data[data.length - 1];
                this[key].listeners.forEach((callback) => {
                    callback(latestDatum);
                });
            });
            this[key].isSubscribed = true;
        }
    }

    _parseTime(datum) {
        return this._timeFormatter.parse(datum);
    }

    _timeSystemChange(system) {
        let key = system.key;
        let metadata = this._openmct.telemetry.getMetadata(this._domainObject);
        let metadataValue = metadata.value(key) || { format: key };
        this._timeFormatter = this._openmct.telemetry.getValueFormatter(metadataValue);
    }

    destroy() {
        this._openmct.time.off('timeSystem', this._timeSystemChange);
        for (let key of this.keys) {
            if (this[key]?.telemetryCollection) {
                this[key].telemetryCollection.destroy();
            }
        }
    }

}
