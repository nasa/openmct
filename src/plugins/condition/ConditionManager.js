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

import Condition from "./Condition";
import uuid from "uuid";
import EventEmitter from 'EventEmitter';

export default class ConditionManager extends EventEmitter {
    constructor(conditionSetDomainObject, openmct) {
        super();
        this.openmct = openmct;
        this.conditionSetDomainObject = conditionSetDomainObject;
        this.timeAPI = this.openmct.time;
        this.latestTimestamp = {};
        this.instantiate = this.openmct.$injector.get('instantiate');
        this.initialize();
    }

    initialize() {
        this.conditionResults = {};
        this.conditionClassCollection = [];
        if (this.conditionSetDomainObject.configuration.conditionCollection.length) {
            this.conditionSetDomainObject.configuration.conditionCollection.forEach((conditionConfiguration, index) => {
                this.initCondition(conditionConfiguration, index);
            });
        }
    }

    //this should not happen very frequently
    update(newConditionCollection) {
        this.destroy();
        this.conditionSetDomainObject.configuration.conditionCollection = newConditionCollection;
        this.initialize();
    }

    updateCondition(conditionConfiguration, index) {
        let condition = this.conditionClassCollection[index];
        condition.update(conditionConfiguration);
        this.conditionSetDomainObject.configuration.conditionCollection[index] = conditionConfiguration;
        this.persistConditions();
    }

    initCondition(conditionConfiguration, index) {
        let condition = new Condition(conditionConfiguration, this.openmct);
        condition.on('conditionResultUpdated', this.handleConditionResult.bind(this));
        if (index !== undefined) {
            this.conditionClassCollection.splice(index + 1, 0, condition);
        } else {
            this.conditionClassCollection.unshift(condition);
        }
        //There are no criteria for a default condition and hence no subscriptions.
        //Hence the conditionResult must be manually triggered for it.
        if (conditionConfiguration.isDefault) {
            this.handleConditionResult();
        }
    }

    createCondition(conditionConfiguration) {
        let conditionObj;
        if (conditionConfiguration) {
            conditionObj = {
                ...conditionConfiguration,
                name: `Copy of ${conditionConfiguration.name}`,
                id: uuid()
            };
        } else {
            conditionObj = {
                type: 'condition',
                id: uuid(),
                configuration: {
                    name: 'Unnamed Condition',
                    output: 'false',
                    trigger: 'all',
                    criteria: [{
                        telemetry: '',
                        operation: '',
                        input: [],
                        metadata: ''
                    }]
                },
                summary: ''
            };
        }

        return conditionObj;
    }

    addCondition() {
        this.createAndSaveCondition();
    }

    cloneCondition(conditionConfiguration, index) {
        this.createAndSaveCondition(false, index, conditionConfiguration);
    }

    createAndSaveCondition(index, conditionConfiguration) {
        let newCondition = this.createCondition(conditionConfiguration);
        if (index !== undefined) {
            this.conditionSetDomainObject.configuration.conditionCollection.splice(index + 1, 0, newCondition);
        } else {
            this.conditionSetDomainObject.configuration.conditionCollection.unshift(newCondition);
        }
        this.initCondition(newCondition, index);
        this.persistConditions();
    }

    removeCondition(conditionConfiguration, index) {
        let condition = this.conditionClassCollection[index];
        condition.destroyCriteria();
        condition.off('conditionResultUpdated', this.handleConditionResult.bind(this));
        this.conditionClassCollection.splice(index, 1);
        this.conditionSetDomainObject.configuration.conditionCollection.splice(index, 1);
        if (this.conditionResults[condition.id] !== undefined) {
            delete this.conditionResults[condition.id];
        }
        this.persistConditions();
        this.handleConditionResult();
    }

    findConditionById(id) {
        let found;
        for (let i=0, ii=this.conditionClassCollection.length; i < ii; i++) {
            if (this.conditionClassCollection[i].id === id) {
                found = {
                    item: this.conditionClassCollection[i],
                    index: i
                };
                break;
            }
        }

        return found;
    }

    //this.$set(this.conditionClassCollection, reorderEvent.newIndex, oldConditions[reorderEvent.oldIndex]);
    reorderConditions(reorderPlan) {
        let oldConditions = Array.from(this.conditionSetDomainObject.configuration.conditionCollection);
        let newCollection = [];
        reorderPlan.forEach((reorderEvent) => {
            let item = oldConditions[reorderEvent.oldIndex];
            newCollection.push(item);
            this.conditionSetDomainObject.configuration.conditionCollection = newCollection;
        });
        this.persistConditions();
    }

    handleConditionResult(resultObj) {
        const conditionCollection = this.conditionSetDomainObject.configuration.conditionCollection;
        let currentCondition = conditionCollection[conditionCollection.length-1];

        if (resultObj) {
            const id = resultObj.id;
            if (this.findConditionById(id)) {
                this.conditionResults[id] = resultObj.data.result;
            }
            this.updateTimestamp(resultObj.data);
        }

        for (let i = 0; i < conditionCollection.length - 1; i++) {
            if (this.conditionResults[conditionCollection[i].id]) {
                //first condition to be true wins
                currentCondition = conditionCollection[i];
                break;
            }
        }

        this.emit('conditionSetResultUpdated',
            Object.assign(
                {
                    output: currentCondition.configuration.output,
                    id: this.conditionSetDomainObject.identifier,
                    conditionId: currentCondition.id
                },
                this.latestTimestamp
            )
        )
    }

    updateTimestamp(timestamp) {
        this.timeAPI.getAllTimeSystems().forEach(timeSystem => {
            if (!this.latestTimestamp[timeSystem.key]
                || timestamp[timeSystem.key] > this.latestTimestamp[timeSystem.key]
            ) {
                this.latestTimestamp[timeSystem.key] = timestamp[timeSystem.key];
            }
        });
    }

    persistConditions() {
        this.openmct.objects.mutate(this.conditionSetDomainObject, 'configuration.conditionCollection', this.conditionSetDomainObject.configuration.conditionCollection);
    }

    destroy() {
        this.conditionClassCollection.forEach((condition) => {
            condition.off('conditionResultUpdated', this.handleConditionResult);
            condition.destroy();
        })
    }
}
