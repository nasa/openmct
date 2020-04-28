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

import TelemetryCriterion from './TelemetryCriterion';
import { evaluateResults } from "../utils/evaluator";
import { getLatestTimestamp } from '../utils/time';
import { getOperatorText } from "@/plugins/condition/utils/operations";

export default class AllTelemetryCriterion extends TelemetryCriterion {

    /**
     * Subscribes/Unsubscribes to telemetry and emits the result
     * of operations performed on the telemetry data returned and a given input value.
     * @constructor
     * @param telemetryDomainObjectDefinition {id: uuid, operation: enum, input: Array, metadata: string, key: {domainObject.identifier} }
     * @param openmct
     */
    constructor(telemetryDomainObjectDefinition, openmct) {
        super(telemetryDomainObjectDefinition, openmct);
    }

    initialize() {
        this.telemetryObjects = { ...this.telemetryDomainObjectDefinition.telemetryObjects };
        this.telemetryDataCache = {};
    }

    isValid() {
        return (this.telemetry === 'any' || this.telemetry === 'all') && this.metadata && this.operation;
    }

    updateTelemetryObjects(telemetryObjects) {
        this.telemetryObjects = { ...telemetryObjects };
        this.removeTelemetryDataCache();
    }

    removeTelemetryDataCache() {
        const telemetryCacheIds = Object.keys(this.telemetryDataCache);
        Object.values(this.telemetryObjects).forEach(telemetryObject => {
            const id = this.openmct.objects.makeKeyString(telemetryObject.identifier);
            const foundIndex = telemetryCacheIds.indexOf(id);
            if (foundIndex > -1) {
                telemetryCacheIds.splice(foundIndex, 1);
            }
        });
        telemetryCacheIds.forEach(id => {
            delete (this.telemetryDataCache[id]);
        });
    }

    formatData(data, telemetryObjects) {
        if (data) {
            this.telemetryDataCache[data.id] = this.computeResult(data);
        }

        let keys = Object.keys(telemetryObjects);
        keys.forEach((key) => {
            let telemetryObject = telemetryObjects[key];
            const id = this.openmct.objects.makeKeyString(telemetryObject.identifier);
            if (this.telemetryDataCache[id] === undefined) {
                this.telemetryDataCache[id] = false;
            }
        });

        const datum = {
            result: evaluateResults(Object.values(this.telemetryDataCache), this.telemetry)
        };

        if (data) {
            this.openmct.time.getAllTimeSystems().forEach(timeSystem => {
                datum[timeSystem.key] = data[timeSystem.key]
            });
        }
        return datum;
    }

    getResult(data, telemetryObjects) {
        const validatedData = this.isValid() ? data : {};

        if (validatedData) {
            this.telemetryDataCache[validatedData.id] = this.computeResult(validatedData);
        }

        Object.values(telemetryObjects).forEach(telemetryObject => {
            const id = this.openmct.objects.makeKeyString(telemetryObject.identifier);
            if (this.telemetryDataCache[id] === undefined) {
                this.telemetryDataCache[id] = false;
            }
        });

        this.result = evaluateResults(Object.values(this.telemetryDataCache), this.telemetry);
    }

    requestLAD(options) {
        options = Object.assign({},
            options,
            {
                strategy: 'latest',
                size: 1
            }
        );

        if (!this.isValid()) {
            return this.formatData({}, options.telemetryObjects);
        }

        let keys = Object.keys(Object.assign({}, options.telemetryObjects));
        const telemetryRequests = keys
            .map(key => this.openmct.telemetry.request(
                options.telemetryObjects[key],
                options
            ));

        let telemetryDataCache = {};
        return Promise.all(telemetryRequests)
            .then(telemetryRequestsResults => {
                let latestTimestamp;
                const timeSystems = this.openmct.time.getAllTimeSystems();
                const timeSystem = this.openmct.time.timeSystem();

                telemetryRequestsResults.forEach((results, index) => {
                    const latestDatum = results.length ? results[results.length - 1] : {};
                    const datumId = keys[index];

                    telemetryDataCache[datumId] = this.computeResult(latestDatum);

                    latestTimestamp = getLatestTimestamp(
                        latestTimestamp,
                        latestDatum,
                        timeSystems,
                        timeSystem
                    );
                });

                const datum = {
                    result: evaluateResults(Object.values(telemetryDataCache), this.telemetry),
                    ...latestTimestamp
                };

                return {
                    id: this.id,
                    data: datum
                };
            });
    }

    getDescription() {
        const telemetryDescription = this.telemetry === 'all' ? 'All telemetry' : 'Any telemetry';
        let metadataValue = this.metadata;
        let inputValue = this.input;
        if (this.metadata) {
            const telemetryObjects = Object.values(this.telemetryObjects);
            for (let i=0; i < telemetryObjects.length; i++) {
                const telemetryObject = telemetryObjects[i];
                const telemetryMetadata = this.openmct.telemetry.getMetadata(telemetryObject);

                const metadataObj = telemetryMetadata.valueMetadatas.find((metadata) => metadata.key === this.metadata);
                if (metadataObj) {

                    if (metadataObj.name) {
                        metadataValue = metadataObj.name;
                    }
                    if(metadataObj.enumerations && inputValue.length) {
                        if (metadataObj.enumerations[inputValue[0]] && metadataObj.enumerations[inputValue[0]].string) {
                            inputValue = [metadataObj.enumerations[inputValue[0]].string];
                        }
                    }
                    break;
                }
            }
        }
        return `${telemetryDescription} ${metadataValue} ${getOperatorText(this.operation, inputValue)}`;
    }

    destroy() {
        delete this.telemetryObjects;
        delete this.telemetryDataCache;
    }
}
