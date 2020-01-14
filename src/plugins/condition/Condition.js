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
import uuid from 'uuid';
import TelemetryCriterion from "@/plugins/condition/criterion/TelemetryCriterion";
import { TRIGGER } from "@/plugins/condition/utils/constants";

/*
* conditionDefinition = {
*   trigger: 'any'/'all',
*   criteria: [
*       {
*           operation: '',
*           input: '',
*           metaDataKey: '',
*           key: 'someTelemetryObjectKey'
*       }
*   ]
* }
*/
export default class ConditionClass extends EventEmitter {

    constructor(conditionDefinition, openmct) {
        super();

        this.openmct = openmct;
        this.telemetryAPI = this.openmct.telemetry;
        this.objectAPI = this.openmct.objects;
        this.id = uuid();
        if (conditionDefinition.criteria) {
            this.createCriteria(conditionDefinition.criteria);
        } else {
            this.criteria = [];
        }
        this.trigger = conditionDefinition.trigger;
        this.result = null;
    }

    updateTrigger(conditionDefinition) {
        if (this.trigger !== conditionDefinition.trigger) {
            this.trigger = conditionDefinition.trigger;
            this.handleConditionUpdated();
        }
    }

    generateCriterion(criterionDefinition) {
        return {
            id: uuid(),
            operation: criterionDefinition.operation || '',
            input: criterionDefinition.input === undefined ? [] : criterionDefinition.input,
            metaDataKey: criterionDefinition.metaDataKey || '',
            key: criterionDefinition.key || ''
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
        let criterionDefinitionWithId = this.generateCriterion(criterionDefinition || null);
        console.log(criterionDefinitionWithId);
        this.objectAPI.get(this.objectAPI.makeKeyString(criterionDefinitionWithId.key)).then((obj) => {
            if (this.telemetryAPI.isTelemetryObject(obj)) {
                let criterion = new TelemetryCriterion(obj, this.openmct);
                criterion.on('criterionUpdated', this.handleCriterionUpdated);
                if (!this.criteria) {
                    this.criteria = [];
                }
                this.criteria.push(criterion);
                this.handleConditionUpdated();
                return criterionDefinitionWithId.id;
            } else {
                return null;
            }
        });
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

    updateCriterion(id, criterionDefinition) {
        let found = this.findCriterion(id);
        if (found) {
            const newCriterionDefinition = this.generateCriterion(criterionDefinition);
            let newCriterion = new TelemetryCriterion(newCriterionDefinition, this.openmct);
            let criterion = found.item;
            criterion.unsubscribe();
            criterion.off('criterionUpdated', (result) => {
                this.handleCriterionUpdated(id, result);
            });
            this.criteria.splice(found.index, 1, newCriterion);
            this.handleConditionUpdated();
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
            criterion.unsubscribe();
            criterion.off('criterionUpdated', (result) => {
                this.handleCriterionUpdated(id, result);
            });
            this.criteria.splice(found.index, 1);
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
        this.emitResult();
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

    //TODO: implement as part of the evaluator class task.
    evaluate() {
        if (this.trigger === TRIGGER.ANY) {
            this.result = false;
        } else if (this.trigger === TRIGGER.ALL) {
            this.result = false;
        }
    }

    emitResult(data, error) {
        this.emit('conditionUpdated', {
            identifier: this.id,
            data: data,
            error: error
        });
    }
}
