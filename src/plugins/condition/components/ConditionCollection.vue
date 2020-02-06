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

<template>
<section id="conditionCollection"
         class="c-cs__ui_section"
>
    <div class="c-cs__ui__header">
        <span class="c-cs__ui__header-label">Conditions</span>
        <span
            class="is-enabled flex-elem"
            :class="['c-cs__disclosure-triangle', { 'c-cs__disclosure-triangle--expanded': expanded }]"
            @click="expanded = !expanded"
        ></span>
    </div>
    <div v-if="expanded"
         class="c-cs__ui_content"
    >
        <div v-show="isEditing"
             class="help"
        >
            <span>The first condition to match is the one that wins. Drag conditions to rearrange.</span>
        </div>
        <div class="holder add-condition-button-wrapper align-left">
            <button
                v-show="isEditing"
                id="addCondition"
                class="c-cs-button c-cs-button--major add-condition-button"
                @click="addCondition"
            >
                <span class="c-cs-button__label">Add Condition</span>
            </button>
        </div>
        <div class="c-c condition-collection">
            <ul class="c-c__container-holder">
                <li v-for="(conditionIdentifier, index) in conditionCollection"
                    :key="conditionIdentifier.key"
                >
                    <div v-if="isEditing"
                         class="c-c__drag-ghost"
                         @drop.prevent="dropCondition"
                         @dragenter="dragEnter"
                         @dragleave="dragLeave"
                         @dragover.prevent
                    ></div>
                    <Condition :condition-identifier="conditionIdentifier"
                               :current-condition-identifier="currentConditionIdentifier"
                               :condition-index="index"
                               :telemetry="telemetryObjs"
                               :is-editing="isEditing"
                               @update-current-condition="updateCurrentCondition"
                               @removeCondition="removeCondition"
                               @conditionResultUpdated="handleConditionResult"
                               @setMoveIndex="setMoveIndex"
                    />
                </li>
            </ul>
        </div>
    </div>
</section>
</template>

<script>
import Condition from '../../condition/components/Condition.vue';
import uuid from 'uuid';


export default {
    inject: ['openmct', 'domainObject'],
    components: {
        Condition
    },
    props: {
        isEditing: Boolean
    },
    data() {
        return {
            expanded: true,
            telemetryObjs: [],
            parentKeyString: this.openmct.objects.makeKeyString(this.domainObject.identifier),
            conditionCollection: [],
            conditionResults: {},
            conditions: [],
            currentConditionIdentifier: this.currentConditionIdentifier || {},
            moveIndex: Number,
            isDragging: false
        };
    },
    destroyed() {
        this.composition.off('add', this.addTelemetryObject);
    },
    mounted() {
        this.instantiate = this.openmct.$injector.get('instantiate');
        this.composition = this.openmct.composition.get(this.domainObject);
        this.composition.on('add', this.addTelemetryObject);
        this.composition.on('remove', this.removeTelemetryObject);
        this.composition.load();
        this.conditionCollection = this.domainObject.configuration.conditionCollection;
        if (!this.conditionCollection.length) {
            this.addCondition(null, true);
        } else {
            this.updateCurrentCondition(this.conditionCollection[0]);
        }
    },
    methods: {
        setMoveIndex(index) {
            this.moveIndex = index;
            this.isDragging = true;
        },
        dropCondition(e) {
            let targetIndex = Array.from(document.querySelectorAll('.c-c__drag-ghost')).indexOf(e.target);
            if (targetIndex > this.moveIndex) { targetIndex-- } // for 'downward' move
            const oldIndexArr = Object.keys(this.conditionCollection);
            const move = function (arr, old_index, new_index) {
                while (old_index < 0) {
                    old_index += arr.length;
                }
                while (new_index < 0) {
                    new_index += arr.length;
                }
                if (new_index >= arr.length) {
                    var k = new_index - arr.length;
                    while ((k--) + 1) {
                        arr.push(undefined);
                    }
                }
                arr.splice(new_index, 0, arr.splice(old_index, 1)[0]);
                return arr;
            }
            const newIndexArr = move(oldIndexArr, this.moveIndex, targetIndex);
            const reorderPlan = [];

            for (let i = 0; i < oldIndexArr.length; i++) {
                reorderPlan.push({oldIndex: Number(newIndexArr[i]), newIndex: i});
            }

            this.reorder(reorderPlan);

            e.target.classList.remove("dragging");
            this.isDragging = false;
        },
        dragEnter(e) {
            if (!this.isDragging) { return }
            let targetIndex = Array.from(document.querySelectorAll('.c-c__drag-ghost')).indexOf(e.target);
            if (targetIndex > this.moveIndex) { targetIndex-- } // for 'downward' move
            if (this.moveIndex === targetIndex) { return }
            e.target.classList.add("dragging");
        },
        dragLeave(e) {
            e.target.classList.remove("dragging");
        },
        handleConditionResult(args) {
            let idAsString = this.openmct.objects.makeKeyString(args.id);
            this.conditionResults[idAsString] = args.result;
            this.updateCurrentConditionIdentifier();
        },
        updateCurrentConditionIdentifier() {
            let currentConditionIdentifier = this.conditionCollection[this.conditionCollection.length-1];
            for (let i = 0; i < this.conditionCollection.length - 1; i++) {
                let conditionIdentifierAsString = this.openmct.objects.makeKeyString(this.conditionCollection[i]);
                if (this.conditionResults[conditionIdentifierAsString]) {
                    // TODO: first condition to be true wins
                    currentConditionIdentifier = this.conditionCollection[i];
                    break;
                }
            }
            this.$emit('currentConditionUpdated', currentConditionIdentifier);
        },
        addTelemetryObject(domainObject) { // JM: don't see how object param ever gets passed to this
            this.telemetryObjs.push(domainObject);
        },
        removeTelemetryObject(identifier) {  // JM: don't see how identifier param ever gets passed to this
            let index = _.findIndex(this.telemetryObjs, (obj) => {
                let objId = this.openmct.objects.makeKeyString(obj.identifier);
                let id = this.openmct.objects.makeKeyString(identifier);
                return objId === id;
            });
            if (index > -1) {
                this.telemetryObjs.splice(index, 1);
            }
        },
        addCondition(event, isDefault) {
            let conditionDomainObject = this.createConditionDomainObject(!!isDefault);
            //persist the condition domain object so that we can do an openmct.objects.get on it and only persist the identifier in the conditionCollection of conditionSet
            this.conditionCollection.unshift(conditionDomainObject.identifier);
            this.persist();
        },
        updateCurrentCondition(identifier) {
            this.currentConditionIdentifier = identifier;
        },
        createConditionDomainObject(isDefault) {
            let conditionObj = {
                isDefault: isDefault,
                name: isDefault ? 'Default' : 'Unnamed Condition',
                identifier: {
                    namespace: this.domainObject.identifier.namespace,
                    key: uuid()
                },
                configuration: {
                    name: isDefault ? 'Default' : 'Unnamed Condition',
                    output: 'false',
                    trigger: 'any',
                    criteria: isDefault ? [] : [{
                        operation: '',
                        input: '',
                        metaDataKey: '',
                        identifier: {
                            namespace: '',
                            key: this.telemetryObjs.length ? this.openmct.objects.makeKeyString(this.telemetryObjs[0].identifier) : null
                        }
                    }]
                },
                summary: 'summary description',
                created: new Date()
            };
            let conditionDomainObjectKeyString = this.openmct.objects.makeKeyString(conditionObj.identifier);
            let newDomainObject = this.instantiate(conditionObj, conditionDomainObjectKeyString);

            return newDomainObject.useCapability('adapter');
        },
        updateCondition(updatedCondition) {
            let index = _.findIndex(this.conditions, (condition) => condition.id === updatedCondition.id);
            this.conditions[index] = updatedCondition;
        },
        removeCondition(identifier) {
            let index = _.findIndex(this.conditionCollection, (condition) => {
                let conditionId = this.openmct.objects.makeKeyString(condition);
                let id = this.openmct.objects.makeKeyString(identifier);
                return conditionId === id;
            });
            this.conditionCollection.splice(index, 1);
            this.persist();
            this.updateCurrentConditionIdentifier();
        },
        reorder(reorderPlan) {
            let oldConditions = this.conditionCollection.slice();
            reorderPlan.forEach((reorderEvent) => {
                this.$set(this.conditionCollection, reorderEvent.newIndex, oldConditions[reorderEvent.oldIndex]);
            });
            this.persist();
        },
        updateTelemetryObjects(identifier) {
            if (this.hasTelemetry(identifier)) {
                this.openmct.objects.get(identifier).then((obj) => {
                    this.telemetryMetadata[identifier] = this.openmct.telemetry.getMetadata(obj).values();
                    this.selectedFieldObject[identifier] = this.getTelemetryMetadataKey(identifier);
                    this.selectedTelemetryObject[identifier] = this.getTelemetryObject(identifier);
                    // console.log('this.telemetryMetadata[identifier]', this.telemetryMetadata[identifier])
                    // console.log('this.selectedMetadataKey[identifier]', this.selectedMetadataKey[identifier])
                    console.log('this.selectedTelemetryObject[identifier]', this.selectedTelemetryObject[identifier])
                });
            }
        },
        getTelemetryMetadataKey(identifier) {
            let index = -1;
            if (identifier) {
                index = _.findIndex(this.telemetryMetadata[identifier], (metadata) => {
                    return metadata.key === this.currentCriteria.metadataKey;
                });
            }
            return this.telemetryMetadata[identifier].length && index > -1 ? this.telemetryMetadata[identifier][index].key : '- Select Telemetry -';
        },
        getTelemetryObject(identifier) {
            let index = -1;
            if (this.currentCriteria && identifier) {
                let conditionKey = this.openmct.objects.makeKeyString(identifier);
                index = _.findIndex(this.telemetry, (obj) => {
                    let key = this.openmct.objects.makeKeyString(obj.identifier)
                    return key === conditionKey
                });
            }
            return this.telemetry.length && index > -1 ? this.telemetry[index] : '';
        },

        persist() {
            this.openmct.objects.mutate(this.domainObject, 'configuration.conditionCollection', this.conditionCollection);
        }
    }
}
</script>
