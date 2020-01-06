/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2019, United States Government
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
import UUID from 'uuid';
import TelemetryCriterion from "@/plugins/condition/criterion/TelemetryCriterion";
import {computeConditionForAll, computeConditionForAny} from 'utils/evaluator'
import { TRIGGER } from "@/plugins/condition/utils/constants";

/*
* conditionDefinition = {
*   trigger: 'any'/'all',
*   criteria: [
*       {
*           object: {
*               operator: '',
*               input: '',
*               metaDataKey: '',
*               telemetryObjectKey: 'someTelemetryObjectKey'
*           }
*       }
*   ]
* }
*/
export default class Condition extends EventEmitter {

    constructor(conditionDefinition, openmct) {
        super();

        this.openmct = openmct;
        this.id = new UUID();
        this.criteriaMap = conditionDefinition.criteria ? this.createCriteria(conditionDefinition.criteria) : {};
        this.trigger = conditionDefinition.trigger;
        this.result = null;
    }

    updateTrigger(conditionDefinition) {
        if (this.trigger !== conditionDefinition.trigger) {
            this.trigger = conditionDefinition.trigger;
            this.handleConditionUpdated();
        }
    }

    generateNewCriterion() {
        return {
            id: new UUID(),
            object: '',
            key: '',
            operation: '',
            values: []
        };
    }

    createCriteria(criterionDefinitions) {
        criterionDefinitions.forEach((criterionDefinition) => {
            this.addCriterion(criterionDefinition);
        });
    }

    updateCriteria(criterionDefinitions) {
        this.destroyCriteria();
        this.createCriteria(criterionDefinitions);
    }

    /**
     *  adds criterion to the condition.
     */
    addCriterion(criterionDefinition) {
        if (!criterionDefinition) {
            criterionDefinition = this.generateNewCriterion();
        }
        let criterion = new TelemetryCriterion(criterionDefinition.object, this.openmct);
        criterion.on('criterion::Update', this.handleCriterionUpdated);
        this.criteriaMap[criterionDefinition.id] = criterion;
        this.handleConditionUpdated();
        return criterionDefinition.id;
    }

    findCriterion(id) {
        return this.criteriaMap[id] || null;
    }

    updateCriterion(id, criterionDefinition) {
        if (this.destroyCriterion(id)) {
            this.criteriaMap[id] = new TelemetryCriterion(criterionDefinition.object, this.openmct);
            this.handleConditionUpdated();
        }
    }

    removeCriterion(id) {
        if (this.destroyCriterion(id)) {
            this.handleConditionUpdated();
        }
    }

    destroyCriterion(id) {
        let criterion = this.findCriterion(id);
        const criterionId = id;
        if (criterion) {
            criterion.unsubscribe();
            criterion.off('criterion::Update', (result) => {
                this.handleCriterionUpdated(criterionId, result);
            });
            delete this.criteriaMap[id];
            return true;
        }
        return false;
    }

    handleCriterionUpdated(id, result) {
        // reevaluate the condition's output
        // TODO: should we save the result of a criterion here or in the criterion object itself?
        this.evaluate();
        this.handleConditionUpdated();
    }

    handleConditionUpdated() {
        // trigger an updated event so that consumers can react accordingly
    }

    getCriteria() {
        let criteria = [];
        for(let id in this.criteriaMap) {
            if (this.criteriaMap.hasOwnProperty(id) && this.criteriaMap[id]) {
                criteria.push(this.criteriaMap[id]);
            }
        }

        return criteria;
    }

    destroyCriteria() {
        let success = true;
        for(let id in this.criteriaMap) {
            if (this.criteriaMap.hasOwnProperty(id) && this.criteriaMap[id]) {
                success = success && this.destroyCriterion(this.criteriaMap[id]);
            }
        }

        return success;
    }

    evaluate() {
        let criteria = this.getCriteria();
        if (this.trigger === TRIGGER.ANY) {
            this.result = computeConditionForAny(criteria);
        } else if (this.trigger === TRIGGER.ALL) {
            this.result = computeConditionForAll(criteria);
        }
    }

    emitResult(data, error) {
        this.emit('condition::Update', {
            identifier: this.id,
            data: data,
            error: error
        });
    }
}
