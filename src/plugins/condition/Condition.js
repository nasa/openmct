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
import { evaluateResults } from './utils/evaluator';
import { getLatestTimestamp } from './utils/time';
import AllTelemetryCriterion from "./criterion/AllTelemetryCriterion";

/*
* conditionConfiguration = {
*   id: uuid,
*   trigger: 'any'/'all'/'not','xor',
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
        this.result = undefined;
        this.timeSystems = this.openmct.time.getAllTimeSystems();
        if (conditionConfiguration.configuration.criteria) {
            this.createCriteria(conditionConfiguration.configuration.criteria);
        }
        this.trigger = conditionConfiguration.configuration.trigger;
    }

    getResult(datum) {
        if (!datum || !datum.id) {
            console.log('no data received');
            return;
        }
        this.criteria.forEach(criterion => {
            if (this.isAnyOrAllTelemetry(criterion)) {
                criterion.getResult(datum, this.conditionManager.telemetryObjects);
            } else {
                criterion.getResult(datum);
            }
        });

        this.result = evaluateResults(this.criteria.map(criterion => criterion.result), this.trigger);
    }

    isAnyOrAllTelemetry(criterion) {
        return (criterion.telemetry && (criterion.telemetry === 'all' || criterion.telemetry === 'any'));
    }

    isTelemetryUsed(id) {
        return this.criteria.some(criterion => {
            return this.isAnyOrAllTelemetry(criterion) || criterion.telemetryObjectIdAsString === id;
        });
    }

    update(conditionConfiguration) {
        this.updateTrigger(conditionConfiguration.configuration.trigger);
        this.updateCriteria(conditionConfiguration.configuration.criteria);
    }

    updateTrigger(trigger) {
        if (this.trigger !== trigger) {
            this.trigger = trigger;
        }
    }

    generateCriterion(criterionConfiguration) {
        return {
            id: criterionConfiguration.id || uuid(),
            telemetry: criterionConfiguration.telemetry || '',
            telemetryObject: this.conditionManager.telemetryObjects[this.openmct.objects.makeKeyString(criterionConfiguration.telemetry)],
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

    updateTelemetry() {
        this.criteria.forEach((criterion) => {
            criterion.updateTelemetry(this.conditionManager.telemetryObjects);
        });
    }

    /**
     *  adds criterion to the condition.
     */
    addCriterion(criterionConfiguration) {
        let criterion;
        let criterionConfigurationWithId = this.generateCriterion(criterionConfiguration || null);
        if (criterionConfiguration.telemetry && (criterionConfiguration.telemetry === 'any' || criterionConfiguration.telemetry === 'all')) {
            criterion = new AllTelemetryCriterion(criterionConfigurationWithId, this.openmct);
        } else {
            criterion = new TelemetryCriterion(criterionConfigurationWithId, this.openmct);
        }
        criterion.on('criterionUpdated', (obj) => this.handleCriterionUpdated(obj));
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

            let criterion = found.item;
            criterion.unsubscribe();
            criterion.off('criterionUpdated', (obj) => this.handleCriterionUpdated(obj));
            this.criteria.splice(found.index, 1, newCriterion);
        }
    }

    destroyCriterion(id) {
        let found = this.findCriterion(id);
        if (found) {
            let criterion = found.item;
            criterion.off('criterionUpdated', (obj) => {
                this.handleCriterionUpdated(obj);
            });
            criterion.destroy();
            this.criteria.splice(found.index, 1);

            return true;
        }
        return false;
    }

    handleCriterionUpdated(criterion) {
        let found = this.findCriterion(criterion.id);
        if (found) {
            this.criteria[found.index] = criterion.data;
        }
    }

    requestLADConditionResult() {
        let latestTimestamp;
        let criteriaResults = {};
        const criteriaRequests = this.criteria
            .map(criterion => criterion.requestLAD({telemetryObjects: this.conditionManager.telemetryObjects}));

        return Promise.all(criteriaRequests)
            .then(results => {
                results.forEach(resultObj => {
                    const { id, data, data: { result } } = resultObj;
                    if (this.findCriterion(id)) {
                        criteriaResults[id] = !!result;
                    }
                    latestTimestamp = getLatestTimestamp(
                        latestTimestamp,
                        data,
                        this.timeSystems,
                        this.openmct.time.timeSystem()
                    );
                });
                return {
                    id: this.id,
                    data: Object.assign(
                        {},
                        latestTimestamp,
                        { result: evaluateResults(Object.values(criteriaResults), this.trigger) }
                    )
                };
            });
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

    destroy() {
        this.destroyCriteria();
    }
}
