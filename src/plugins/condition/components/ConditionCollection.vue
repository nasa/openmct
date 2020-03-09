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
         class="c-cs__conditions"
         :class="{ 'is-expanded': expanded }"
>
    <div class="c-cs__header c-section__header">
        <span
            class="c-disclosure-triangle c-tree__item__view-control is-enabled"
            :class="{ 'c-disclosure-triangle--expanded': expanded }"
            @click="expanded = !expanded"
        ></span>
        <div class="c-cs__header-label c-section__label">Conditions</div>
    </div>
    <div v-if="expanded"
         class="c-cs__content"
    >
        <div v-show="isEditing"
             class="hint"
             :class="{ 's-status-icon-warning-lo': !telemetryObjs.length }"
        >
            <template v-if="!telemetryObjs.length">Drag telemetry into this Condition Set to configure Conditions and add criteria.</template>
            <template v-else>The first condition to match is the one that is applied. Drag conditions to reorder.</template>
        </div>

        <button
            v-show="isEditing"
            id="addCondition"
            class="c-button c-button--major icon-plus labeled"
            @click="addCondition"
        >
            <span class="c-cs-button__label">Add Condition</span>
        </button>

        <div class="c-cs__conditions-h">
            <div v-for="(conditionIdentifier, index) in conditionCollection"
                 :key="conditionIdentifier.key"
                 class="c-condition-h"
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
                           @removeCondition="removeCondition"
                           @cloneCondition="cloneCondition"
                           @setMoveIndex="setMoveIndex"
                />
            </div>
        </div>
    </div>
</section>
</template>

<script>
import Condition from './Condition.vue';
import ConditionManager from '../ConditionManager';

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
            parentKeyString: this.openmct.objects.makeKeyString(this.domainObject.identifier),
            conditionCollection: [],
            conditionResults: {},
            conditions: [],
            currentConditionIdentifier: this.currentConditionIdentifier || {},
            telemetryObjs: [],
            moveIndex: Number,
            isDragging: false
        };
    },
    destroyed() {
        this.composition.off('add', this.addTelemetryObject);
        this.composition.off('remove', this.removeTelemetryObject);
        if(this.conditionManager) {
            this.conditionManager.destroy();
        }
        if (typeof this.stopObservingForChanges === 'function') {
            this.stopObservingForChanges();
        }
    },
    mounted() {
        this.composition = this.openmct.composition.get(this.domainObject);
        this.composition.on('add', this.addTelemetryObject);
        this.composition.on('remove', this.removeTelemetryObject);
        this.composition.load();
        this.conditionCollection = this.domainObject.configuration.conditionCollection;
        this.conditionManager = new ConditionManager(this.domainObject, this.openmct);
        this.observeForChanges();
    },
    methods: {
        observeForChanges() {
            this.stopObservingForChanges = this.openmct.objects.observe(this.domainObject, '*', (newDomainObject) => {
                this.conditionCollection = newDomainObject.configuration.conditionCollection;
            });
        },
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
        addTelemetryObject(domainObject) {
            this.telemetryObjs.push(domainObject);
        },
        removeTelemetryObject(identifier) {
            let index = _.findIndex(this.telemetryObjs, (obj) => {
                let objId = this.openmct.objects.makeKeyString(obj.identifier);
                let id = this.openmct.objects.makeKeyString(identifier);
                return objId === id;
            });
            if (index > -1) {
                this.telemetryObjs.splice(index, 1);
            }
        },
        addCondition(event, isDefault, index) {
            this.conditionManager.addCondition(!!isDefault, index);
        },
        updateCurrentCondition(identifier) {
            this.currentConditionIdentifier = identifier;
        },
        removeCondition(identifier) {
            this.conditionManager.removeCondition(identifier);
        },
        reorder(reorderPlan) {
            this.conditionManager.reorderConditions(reorderPlan);
        },
        cloneCondition(condition) {
            this.conditionManager.cloneCondition(condition.identifier, condition.index);
        }
    }
}
</script>
