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

import * as EventEmitter from 'eventemitter3';
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
        this.subscription = null;
        this.telemetryObjectIdAsString = null;
        this.objectAPI.get(this.objectAPI.makeKeyString(this.telemetry)).then((obj) => this.initialize(obj));
    }

    initialize(obj) {
        this.telemetryObject = obj;
        this.telemetryObjectIdAsString = this.objectAPI.makeKeyString(this.telemetryObject.identifier);
        this.emitEvent('criterionUpdated', this);
    }

    handleSubscription(data) {
        const datum = {};
        const timeSystemKey = this.timeAPI.timeSystem().key;

        datum.result = this.computeResult(data);
        if (data && data[timeSystemKey]) {
            datum[timeSystemKey] = data[timeSystemKey]
        }

        this.emitEvent('criterionResultUpdated', datum);
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
                params.push(this.input[0]);
            } else {
                params.push(this.input);
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
        return this.telemetryObject && this.metadata && this.operation;
    }

    /**
     *  Subscribes to the telemetry object and returns an unsubscribe function
     *  If the telemetry is not valid, returns nothing
     */
    subscribe() {
        if (this.isValid()) {
            this.unsubscribe();
            this.subscription = this.telemetryAPI.subscribe(this.telemetryObject, (datum) => {
                this.handleSubscription(datum);
            });
        } else {
            this.handleSubscription();
        }
    }

    /**
     *  Calls an unsubscribe function returned by subscribe() and deletes any initialized data
     */
    unsubscribe() {
        //unsubscribe from telemetry source
        if (typeof this.subscription === 'function') {
            this.subscription();
        }
        delete this.subscription;
    }

    destroy() {
        this.unsubscribe();
        this.emitEvent('criterionRemoved');
        delete this.telemetryObjectIdAsString;
        delete this.telemetryObject;
    }
}
