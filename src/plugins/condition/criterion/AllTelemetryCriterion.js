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

import EventEmitter from 'EventEmitter';
import {OPERATIONS} from '../utils/operations';
import {computeCondition} from "@/plugins/condition/utils/evaluator";

export default class TelemetryCriterion extends EventEmitter {

    /**
     * Subscribes/Unsubscribes to telemetry and emits the result
     * of operations performed on the telemetry data returned and a given input value.
     * @constructor
     * @param telemetryDomainObjectDefinition {id: uuid, operation: enum, input: Array, metadata: string, key: {domainObject.identifier} }
     * @param openmct
     */
    constructor(telemetryDomainObjectDefinition, openmct) {
        super();

        this.openmct = openmct;
        this.objectAPI = this.openmct.objects;
        this.telemetryAPI = this.openmct.telemetry;
        this.timeAPI = this.openmct.time;
        this.id = telemetryDomainObjectDefinition.id;
        this.telemetry = telemetryDomainObjectDefinition.telemetry;
        this.operation = telemetryDomainObjectDefinition.operation;
        this.telemetryObjects = Object.assign({}, telemetryDomainObjectDefinition.telemetryObjects);
        this.input = telemetryDomainObjectDefinition.input;
        this.metadata = telemetryDomainObjectDefinition.metadata;
        this.telemetryDataCache = {};
    }

    updateTelemetry(telemetryObjects) {
        this.telemetryObjects = Object.assign({}, telemetryObjects);
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
            result: computeCondition(this.telemetryDataCache, this.telemetry === 'all')
        };

        if (data) {
            // TODO check back to see if we should format times here
            this.timeAPI.getAllTimeSystems().forEach(timeSystem => {
                datum[timeSystem.key] = data[timeSystem.key]
            });
        }
        return datum;
    }

    handleSubscription(data, telemetryObjects) {
        if(this.isValid()) {
            this.emitEvent('criterionResultUpdated', this.formatData(data, telemetryObjects));
        }
    }

    findOperation(operation) {
        for (let i=0; i < OPERATIONS.length; i++) {
            if (operation === OPERATIONS[i].name) {
                return OPERATIONS[i].operation;
            }
        }
        return null;
    }

    computeResult(data) {
        let result = false;
        if (data) {
            let comparator = this.findOperation(this.operation);
            let params = [];
            params.push(data[this.metadata]);
            if (this.input instanceof Array && this.input.length) {
                this.input.forEach(input => params.push(input));
            }
            if (typeof comparator === 'function') {
                result = comparator(params);
            }
        }
        return result;
    }

    emitEvent(eventName, data) {
        this.emit(eventName, {
            id: this.id,
            data: data
        });
    }

    isValid() {
        return (this.telemetry === 'any' || this.telemetry === 'all') && this.metadata && this.operation;
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

        const telemetryRequests = options.telemetryObjects
            .map(telemetryObject => this.telemetryAPI.request(
                telemetryObject,
                options
            ));

        return Promise.all(telemetryRequests)
            .then(telemetryRequestsResults => {
                telemetryRequestsResults.forEach((results, index) => {
                    const latestDatum = results.length ? results[results.length - 1] : {};
                    if (index === telemetryRequestsResults.length-1) {
                        //when the last result is computed, we return the result
                        return {
                            id: this.id,
                            data: this.formatData(latestDatum, options.telemetryObjects)
                        };
                    } else {
                        if (latestDatum) {
                            this.telemetryDataCache[latestDatum.id] = this.computeResult(latestDatum);
                        }
                    }
                });
            });
    }

    destroy() {
        this.emitEvent('criterionRemoved');
        delete this.telemetryObjects;
        delete this.telemetryDataCache;
        delete this.telemetryObjectIdAsString;
        delete this.telemetryObject;
    }
}
