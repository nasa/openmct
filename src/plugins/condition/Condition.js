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
import uuid from 'uuid';
import TelemetryCriterion from "./criterion/TelemetryCriterion";
import { TRIGGER } from "./utils/constants";
import {computeCondition} from "./utils/evaluator";

/*
* conditionConfiguration = {
*   id: uuid,
*   trigger: 'any'/'all',
*   criteria: [
*       {
*           telemetry: '',
*           operation: '',
*           input: [],
*           metadata: ''
*       }
*   ]
* }
*/
export default class ConditionClass extends EventEmitter {

    /**
     * Manages criteria and emits the result of - true or false - based on criteria evaluated.
     * @constructor
     * @param conditionConfiguration: {id: uuid,trigger: enum, criteria: Array of {id: uuid, operation: enum, input: Array, metaDataKey: string, key: {domainObject.identifier} }
     * @param openmct
     */
    constructor(conditionConfiguration, openmct, conditionManager) {
        super();

        this.openmct = openmct;
        this.conditionManager = conditionManager;
        this.id = conditionConfiguration.id;
        this.criteria = [];
        this.criteriaResults = {};
        this.result = undefined;
        this.latestTimestamp = {};

        if (conditionConfiguration.configuration.criteria) {
            this.createCriteria(conditionConfiguration.configuration.criteria);
        }
        this.trigger = conditionConfiguration.configuration.trigger;
        this.conditionManager.on('broadcastTelemetry', this.handleBroadcastTelemetry, this);
    }

    handleBroadcastTelemetry(datum) {
        if (!datum || !datum.id) {
            console.log('no data received');
            return;
        }
        this.criteria.forEach(criterion => {
            criterion.emit(`subscription:${datum.id}`, datum);
        });
    }

    update(conditionConfiguration) {
        this.updateTrigger(conditionConfiguration.configuration.trigger);
        this.updateCriteria(conditionConfiguration.configuration.criteria);
    }

    updateTrigger(trigger) {
        if (this.trigger !== trigger) {
            this.trigger = trigger;
            this.handleConditionUpdated();
        }
    }

    generateCriterion(criterionConfiguration) {
        return {
            id: uuid(),
            telemetry: criterionConfiguration.telemetry || '',
            operation: criterionConfiguration.operation || '',
            input: criterionConfiguration.input === undefined ? [] : criterionConfiguration.input,
            metadata: criterionConfiguration.metadata || ''
        };
    }

    createCriteria(criterionConfigurations) {
        criterionConfigurations.forEach((criterionConfiguration) => {
            this.addCriterion(criterionConfiguration);
        });
    }

    updateCriteria(criterionConfigurations) {
        this.destroyCriteria();
        this.createCriteria(criterionConfigurations);
    }

    /**
     *  adds criterion to the condition.
     */
    addCriterion(criterionConfiguration) {
        let criterionConfigurationWithId = this.generateCriterion(criterionConfiguration || null);
        let criterion = new TelemetryCriterion(criterionConfigurationWithId, this.openmct);
        criterion.on('criterionUpdated', (obj) => this.handleCriterionUpdated(obj));
        criterion.on('criterionResultUpdated', (obj) => this.handleCriterionResult(obj));
        if (!this.criteria) {
            this.criteria = [];
        }
        this.criteria.push(criterion);
        return criterionConfigurationWithId.id;
    }

    findCriterion(id) {
        let criterion;

        for (let i=0, ii=this.criteria.length; i < ii; i ++) {
            if (this.criteria[i].id === id) {
                criterion = {
                    item: this.criteria[i],
                    index: i
                }
            }
        }

        return criterion;
    }

    updateCriterion(id, criterionConfiguration) {
        let found = this.findCriterion(id);
        if (found) {
            const newCriterionConfiguration = this.generateCriterion(criterionConfiguration);
            let newCriterion = new TelemetryCriterion(newCriterionConfiguration, this.openmct);
            newCriterion.on('criterionUpdated', (obj) => this.handleCriterionUpdated(obj));
            newCriterion.on('criterionResultUpdated', (obj) => this.handleCriterionResult(obj));

            let criterion = found.item;
            criterion.unsubscribe();
            criterion.off('criterionUpdated', (obj) => this.handleCriterionUpdated(obj));
            criterion.off('criterionResultUpdated', (obj) => this.handleCriterionResult(obj));
            this.criteria.splice(found.index, 1, newCriterion);
            if (this.criteriaResults[criterion.id] !== undefined) {
                delete this.criteriaResults[criterion.id];
            }
        }
    }

    removeCriterion(id) {
        if (this.destroyCriterion(id)) {
            this.handleConditionUpdated();
        }
    }

    destroyCriterion(id) {
        let found = this.findCriterion(id);
        if (found) {
            let criterion = found.item;
            criterion.destroy();
            // TODO this is passing the wrong args
            criterion.off('criterionUpdated', (result) => {
                this.handleCriterionUpdated(id, result);
            });
            this.criteria.splice(found.index, 1);
            if (this.criteriaResults[criterion.id] !== undefined) {
                delete this.criteriaResults[criterion.id];
            }
            return true;
        }
        return false;
    }

    handleCriterionUpdated(criterion) {
        let found = this.findCriterion(criterion.id);
        if (found) {
            this.criteria[found.index] = criterion.data;
            // this.subscribe();
            // TODO nothing is listening to this
            this.emitEvent('conditionUpdated', {
                trigger: this.trigger,
                criteria: this.criteria
            });
        }
    }

    updateCriteriaResults(eventData) {
        const id = eventData.id;

        if (this.findCriterion(id)) {
            this.criteriaResults[id] = eventData.data.result;
        }
    }

    handleCriterionResult(eventData) {
        this.updateCriteriaResults(eventData);
        this.handleConditionUpdated(eventData.data);
    }

    requestLADConditionResult() {
        const criteriaResults = this.criteria
            .map(criterion => criterion.requestLAD());

        return Promise.all(criteriaResults)
            .then(results => {
                results.forEach(result => {
                    this.updateCriteriaResults(result);
                    this.latestTimestamp = this.getLatestTimestamp(this.latestTimestamp, result.data)
                });
                this.evaluate();

                return {
                    id: this.id,
                    data: Object.assign({}, this.latestTimestamp, { result: this.result })
                }
            });
    }

    getTelemetrySubscriptions() {
        return this.criteria.map(criterion => criterion.telemetryObjectIdAsString);
    }

    handleConditionUpdated(datum) {
        // trigger an updated event so that consumers can react accordingly
        this.evaluate();
        this.emitEvent('conditionResultUpdated',
            Object.assign({}, datum, { result: this.result })
        );
    }

    getCriteria() {
        return this.criteria;
    }

    destroyCriteria() {
        let success = true;
        //looping through the array backwards since destroyCriterion modifies the criteria array
        for (let i=this.criteria.length-1; i >= 0; i--) {
            success = success && this.destroyCriterion(this.criteria[i].id);
        }
        return success;
    }

    evaluate() {
        this.result = computeCondition(this.criteriaResults, this.trigger === TRIGGER.ALL);
    }

    getLatestTimestamp(current, compare) {
        const timestamp = Object.assign({}, current);

        this.openmct.time.getAllTimeSystems().forEach(timeSystem => {
            if (!timestamp[timeSystem.key]
                || compare[timeSystem.key] > timestamp[timeSystem.key]
            ) {
                timestamp[timeSystem.key] = compare[timeSystem.key];
            }
        });
        return timestamp;
    }

    emitEvent(eventName, data) {
        this.emit(eventName, {
            id: this.id,
            data: data
        });
    }

    destroy() {
        if (typeof this.stopObservingForChanges === 'function') {
            this.stopObservingForChanges();
        }
        this.destroyCriteria();
    }
}
