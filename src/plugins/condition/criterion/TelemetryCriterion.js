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
        this.input = telemetryDomainObjectDefinition.input;
        this.metadata = telemetryDomainObjectDefinition.metadata;
        this.telemetryObject = telemetryDomainObjectDefinition.telemetryObject;
        this.telemetryObjectIdAsString = this.objectAPI.makeKeyString(telemetryDomainObjectDefinition.telemetry);
        this.emitEvent('criterionUpdated', this);
    }

    updateTelemetry(telemetryObjects) {
        this.telemetryObject = telemetryObjects[this.telemetryObjectIdAsString];
    }

    formatData(data) {
        const datum = {
            result: this.computeResult(data)
        };

        if (data) {
            this.timeAPI.getAllTimeSystems().forEach(timeSystem => {
                datum[timeSystem.key] = data[timeSystem.key]
            });
        }
        return datum;
    }

    getResultForTelemetry(data) {
        if (data && data.id &&
            (data.id !== this.telemetryObjectIdAsString)) {
            //We don't want to return any result if we don't care about this telemetry
            //TODO: Should this return the last saved result instead?
            return;
        }
        if (this.isValid()) {
            return {
                id: this.id,
                data: this.formatData(data)
            };
        } else {
            return {
                id: this.id,
                data: this.formatData({})
            };
        }
    }

    findOperation(operation) {
        for (let i=0, ii=OPERATIONS.length; i < ii; i++) {
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
                result = !!comparator(params);
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
        return this.telemetryObject && this.metadata && this.operation;
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
            return {
                id: this.id,
                data: this.formatData({})
            };
        }

        return this.telemetryAPI.request(
            this.telemetryObject,
            options
        ).then(results => {
            const latestDatum = results.length ? results[results.length - 1] : {};
            return {
                id: this.id,
                data: this.formatData(latestDatum)
            };
        });
    }

    destroy() {
        delete this.telemetryObjectIdAsString;
        delete this.telemetryObject;
    }
}
