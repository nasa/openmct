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
import * as EventEmitter from 'eventemitter3';

export default class ConditionManager extends EventEmitter {
    constructor(domainObject, openmct) {
        super();
        this.domainObject = domainObject;
        this.openmct = openmct;
        this.timeAPI = this.openmct.time;
        this.latestTimestamp = {};
        this.instantiate = this.openmct.$injector.get('instantiate');
        this.conditionCollection = [];
        this.composition = this.openmct.composition.get(domainObject);
        this.loaded = this.composition.load();
        this.initialize();
    }

    load() {
        return this.loaded;
    }

    initialize() {
        this.conditionResults = {};

        this.openmct.objects.get(this.domainObject.identifier)
            .then((obj) => {
                this.observeForChanges(obj);
                if (this.domainObject.configuration.conditionCollection.length) {
                    this.domainObject.configuration.conditionCollection.forEach((conditionConfigurationId, index) => {
                        this.openmct.objects.get(conditionConfigurationId).then((conditionConfiguration) => {
                            this.initCondition(conditionConfiguration, index);
                        });
                    });
                } else {
                    this.addCondition(true);
                }
            });
    }

    observeForChanges(domainObject) {
        //TODO: Observe only the conditionCollection property instead of the whole domainObject
        this.stopObservingForChanges = this.openmct.objects.observe(domainObject, '*', this.handleConditionCollectionUpdated.bind(this));
    }

    handleConditionCollectionUpdated(newDomainObject) {
        let oldConditionIdentifiers = this.domainObject.configuration.conditionCollection.map((conditionConfigurationId) => {
            return this.openmct.objects.makeKeyString(conditionConfigurationId);
        });
        let newConditionIdentifiers = newDomainObject.configuration.conditionCollection.map((conditionConfigurationId) => {
            return this.openmct.objects.makeKeyString(conditionConfigurationId);
        });

        this.domainObject = newDomainObject;

        //check for removed conditions
        oldConditionIdentifiers.forEach((identifier, index) => {
            if (newConditionIdentifiers.indexOf(identifier) < 0) {
                this.removeCondition(identifier);
            }
        });

        let newConditionCount = this.domainObject.configuration.conditionCollection.length - this.conditionCollection.length;

        for (let i = 0; i < newConditionCount; i++) {
            let conditionConfigurationId = this.domainObject.configuration.conditionCollection[i];
            this.openmct.objects.get(conditionConfigurationId).then((conditionConfiguration) => {
                this.initCondition(conditionConfiguration, i);
            });
        }

    }

    initCondition(conditionConfiguration, index) {
        let condition = new Condition(conditionConfiguration, this.openmct);
        condition.on('conditionResultUpdated', this.handleConditionResult.bind(this));
        if (index !== undefined) {
            this.conditionCollection.splice(index + 1, 0, condition);
        } else {
            this.conditionCollection.unshift(condition);
        }
    }

    createConditionDomainObject(isDefault, conditionConfiguration) {
        let conditionObj;
        if (conditionConfiguration) {
            conditionObj = {
                ...conditionConfiguration,
                name: `Copy of ${conditionConfiguration.name}`,
                identifier: {
                    ...this.domainObject.identifier,
                    key: uuid()
                }
            };
        } else {
            conditionObj = {
                isDefault: isDefault,
                type: 'condition',
                identifier: {
                    ...this.domainObject.identifier,
                    key: uuid()
                },
                configuration: {
                    name: isDefault ? 'Default' : 'Unnamed Condition',
                    output: 'false',
                    trigger: 'all',
                    criteria: isDefault ? [] : [{
                        telemetry: '',
                        operation: '',
                        input: [],
                        metadata: ''
                    }]
                },
                summary: ''
            };
        }
        let conditionDomainObjectKeyString = this.openmct.objects.makeKeyString(conditionObj.identifier);
        let newDomainObject = this.instantiate(conditionObj, conditionDomainObjectKeyString);

        return newDomainObject.useCapability('adapter');
    }

    addCondition(isDefault, index) {
        this.createAndSaveConditionDomainObject(!!isDefault, index);
    }

    cloneCondition(conditionConfigurationId, index) {
        this.openmct.objects.get(conditionConfigurationId).then((conditionConfiguration) => {
            this.createAndSaveConditionDomainObject(false, index, conditionConfiguration);
        });
    }

    createAndSaveConditionDomainObject(isDefault, index, conditionConfiguration) {
        let newConditionDomainObject = this.createConditionDomainObject(isDefault, conditionConfiguration);
        //persist the condition domain object so that we can do an openmct.objects.get on it and only persist the identifier in the conditionCollection of conditionSet
        this.openmct.objects.mutate(newConditionDomainObject, 'created', new Date());
        if (index !== undefined) {
            this.domainObject.configuration.conditionCollection.splice(index + 1, 0, newConditionDomainObject.identifier);
        } else {
            this.domainObject.configuration.conditionCollection.unshift(newConditionDomainObject.identifier);
        }
        this.persist();
    }

    removeCondition(identifier) {
        let found = this.findConditionById(identifier);
        if (found) {
            let index = found.index;
            let condition = this.conditionCollection[index];
            let conditionIdAsString = condition.id;
            condition.destroyCriteria();
            condition.off('conditionResultUpdated', this.handleConditionResult.bind(this));
            this.conditionCollection.splice(index, 1);
            this.domainObject.configuration.conditionCollection.splice(index, 1);
            if (this.conditionResults[conditionIdAsString] !== undefined) {
                delete this.conditionResults[conditionIdAsString];
            }
            this.persist();
            this.handleConditionResult();
        }
    }

    findConditionById(identifier) {
        let found;
        for (let i=0, ii=this.conditionCollection.length; i < ii; i++) {
            if (this.conditionCollection[i].id === this.openmct.objects.makeKeyString(identifier)) {
                found = {
                    item: this.conditionCollection[i],
                    index: i
                };
                break;
            }
        }

        return found;
    }

    //this.$set(this.conditionCollection, reorderEvent.newIndex, oldConditions[reorderEvent.oldIndex]);
    reorderConditions(reorderPlan) {
        let oldConditions = Array.from(this.domainObject.configuration.conditionCollection);
        let newCollection = [];
        reorderPlan.forEach((reorderEvent) => {
            let item = oldConditions[reorderEvent.oldIndex];
            newCollection.push(item);
            this.domainObject.configuration.conditionCollection = newCollection;
        });
        this.persist();
    }

    getCurrentConditionId() {
        const conditionCollection = this.domainObject.configuration.conditionCollection;
        let currentConditionIdentifier = conditionCollection[conditionCollection.length-1];

        for (let i = 0; i < conditionCollection.length - 1; i++) {
            const conditionIdAsString = this.openmct.objects.makeKeyString(conditionCollection[i]);
            if (this.conditionResults[conditionIdAsString]) {
                //first condition to be true wins
                currentConditionIdentifier = conditionCollection[i];
                break;
            }
        }
        return currentConditionIdentifier;
    }

    updateConditionResults(resultObj) {
        if (!resultObj) {
            return;
        }

        let idAsString = this.openmct.objects.makeKeyString(resultObj.id);

        if (this.findConditionById(idAsString)) {
            this.conditionResults[idAsString] = resultObj.data.result;
        }

        this.updateTimestamp(resultObj.data);
    }

    handleConditionResult(resultObj) {
        this.updateConditionResults(resultObj);

        const currentConditionIdentifier = this.getCurrentConditionId();
        this.openmct.objects.get(currentConditionIdentifier).then((obj) => {
            this.emit('conditionSetResultUpdated',
                Object.assign(
                    {
                        output: obj.configuration.output,
                        id: this.domainObject.identifier,
                        conditionId: currentConditionIdentifier
                    },
                    this.latestTimestamp
                )
            )
        });
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
        if (!this.domainObject.configuration.conditionCollection.length) {
            return Promise.resolve([]);
        }

        return this.load().then(() => {
            if (this.conditionCollection && this.conditionCollection.length === 1) {
                return Promise([]);
            }

            let ladConditionResults = [];

            // do not request LAD for default collection, which is always last
            for (let i = 0; i < this.conditionCollection.length - 1; i++) {
                ladConditionResults.push(this.conditionCollection[i].requestLADConditionResult());
            }
            return Promise.all(ladConditionResults)
                .then((results) => {
                    results.forEach(resultObj => { this.updateConditionResults(resultObj); });
                    const currentConditionIdentifier = this.getCurrentConditionId();
                    return this.openmct.objects.get(currentConditionIdentifier)
                        .then(obj => {
                            // uncomment to see output of lad request (before subscriptions kick in)
                            // console.log(obj.configuration.output);
                            return Object.assign(
                                {
                                    output: obj.configuration.output,
                                    id: this.domainObject.identifier,
                                    conditionId: currentConditionIdentifier
                                },
                                this.latestTimestamp
                            );
                        });
                });
        });
    }

    persist() {
        this.openmct.objects.mutate(this.domainObject, 'configuration.conditionCollection', this.domainObject.configuration.conditionCollection);
    }

    destroy() {
        if (typeof this.stopObservingForChanges === 'function') {
            this.stopObservingForChanges();
        }
        this.conditionCollection.forEach((condition) => {
            condition.off('conditionResultUpdated', this.handleConditionResult);
            condition.destroy();
        })
    }
}
