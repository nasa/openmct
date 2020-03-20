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
        this.composition = this.openmct.composition.get(conditionSetDomainObject);
        this.composition.on('add', this.addTelemetry, this);
        this.composition.on('remove', this.removeTelemetry, this);

        this.loaded = this.composition.load();
        this.subscriptions = {};
        this.initialize();

        this.stopObservingForChanges = this.openmct.objects.observe(this.conditionSetDomainObject, '*', (newDomainObject) => {
            this.conditionSetDomainObject = newDomainObject;
        });
    }

    addTelemetry(endpoint) {
        const id = this.openmct.objects.makeKeyString(endpoint.identifier);
        if (this.subscriptions[id]) {
            console.log('subscription already exists');
            return;
        }

        this.subscriptions[id] = this.openmct.telemetry.subscribe(
            endpoint,
            this.broadcastTelemetry.bind(this, id)
        );
    }

    removeTelemetry(endpointIdentifier) {
        const id = this.openmct.objects.makeKeyString(endpointIdentifier);
        if (!this.subscriptions[id]) {
            console.log('no subscription to remove');
            return;
        }

        this.subscriptions[id]();
        delete this.subscriptions[id];
    }

    load() {
        return this.loaded;
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

    updateCondition(conditionConfiguration, index) {
        let condition = this.conditionClassCollection[index];
        condition.update(conditionConfiguration);
        this.conditionSetDomainObject.configuration.conditionCollection[index] = conditionConfiguration;
        this.persistConditions();
    }

    initCondition(conditionConfiguration, index) {
        let condition = new Condition(conditionConfiguration, this.openmct, this);
        condition.on('conditionResultUpdated', this.handleConditionResult.bind(this));
        if (index !== undefined) {
            this.conditionClassCollection.splice(index + 1, 0, condition);
        } else {
            this.conditionClassCollection.unshift(condition);
        }
    }

    createCondition(conditionConfiguration) {
        let conditionObj;
        if (conditionConfiguration) {
            conditionObj = {
                ...conditionConfiguration,
                id: uuid(),
                configuration: {
                    ...conditionConfiguration.configuration,
                    name: `Copy of ${conditionConfiguration.configuration.name}`
                }
            };
        } else {
            conditionObj = {
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
        this.createAndSaveCondition(index, conditionConfiguration);
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

    removeCondition(index) {
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
        return this.conditionClassCollection.find(conditionClass => conditionClass.id === id);
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

    getCurrentCondition() {
        const conditionCollection = this.conditionSetDomainObject.configuration.conditionCollection;
        let currentCondition = conditionCollection[conditionCollection.length-1];

        for (let i = 0; i < conditionCollection.length - 1; i++) {
            if (this.conditionResults[conditionCollection[i].id]) {
                //first condition to be true wins
                currentCondition = conditionCollection[i];
                break;
            }
        }
        return currentCondition;
    }

    updateConditionResults(resultObj) {
        if (!resultObj) {
            return;
        }

        const id = resultObj.id;

        if (this.findConditionById(id)) {
            this.conditionResults[id] = resultObj.data.result;
        }

        this.updateTimestamp(resultObj.data);
    }

    handleConditionResult(resultObj) {
        // update conditions results and then calculate the current condition
        this.updateConditionResults(resultObj);
        const currentCondition = this.getCurrentCondition();
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

    requestLADConditionSetOutput() {
        if (!this.conditionClassCollection.length || this.conditionClassCollection.length === 1) {
            return Promise.resolve([]);
        }

        return this.load().then(() => {
            const ladConditionResults = this.conditionClassCollection
                .map(condition => condition.requestLADConditionResult());

            return Promise.all(ladConditionResults)
                .then((results) => {
                    results.forEach(resultObj => { this.updateConditionResults(resultObj); });
                    const currentCondition = this.getCurrentCondition();

                    // uncomment to see output of lad request (before subscriptions kick in)
                    // console.log(obj.configuration.output);
                    return Object.assign(
                        {
                            output: currentCondition.configuration.output,
                            id: this.conditionSetDomainObject.identifier,
                            conditionId: currentCondition.id
                        },
                        this.latestTimestamp
                    );
                });
        });
    }

    broadcastTelemetry(id, datum) {
        this.emit(`broadcastTelemetry`, Object.assign({}, datum, {id: id}));
    }

    persistConditions() {
        this.openmct.objects.mutate(this.conditionSetDomainObject, 'configuration.conditionCollection', this.conditionSetDomainObject.configuration.conditionCollection);
    }

    destroy() {
        this.composition.off('add', this.addTelemetry, this);
        this.composition.off('remove', this.removeTelemetry, this);
        Object.values(this.subscriptions).forEach(unsubscribe => unsubscribe());
        this.subscriptions = undefined;

        if(this.stopObservingForChanges) {
            this.stopObservingForChanges();
        }

        this.conditionClassCollection.forEach((condition) => {
            condition.off('conditionResultUpdated', this.handleConditionResult);
            condition.destroy();
        })
    }
}
