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
<div v-if="isEditing"
     class="c-condition is-editing js-condition-drag-wrapper"
     :class="{ 'c-condition--current-match': currentConditionIdentifier && (currentConditionIdentifier.key === conditionIdentifier.key) }"
>
    <!-- Edit view -->
    <div class="c-condition__header">
        <span class="c-condition__drag-grippy c-grippy c-grippy--vertical-drag"
              title="Drag to reorder conditions"
              :class="[{ 'is-enabled': !domainObject.isDefault }, { 'hide-nice': domainObject.isDefault }]"
              :draggable="!domainObject.isDefault"
              @dragstart="dragStart"
              @dragstop="dragStop"
              @dragover.stop
        ></span>

        <span class="c-condition__disclosure c-disclosure-triangle c-tree__item__view-control is-enabled"
              :class="{ 'c-disclosure-triangle--expanded': expanded }"
              @click="expanded = !expanded"
        ></span>

        <span class="c-condition__name">{{ domainObject.configuration.name }}</span>
        <!-- TODO: description should be derived from criteria -->
        <span class="c-condition__summary">{{ domainObject.configuration.name }}</span>

        <div class="c-condition__buttons">
            <button v-if="!domainObject.isDefault"
                    class="c-click-icon c-condition__duplicate-button icon-duplicate"
                    title="Duplicate this condition"
                    @click="cloneCondition"
            ></button>

            <button v-if="!domainObject.isDefault"
                    class="c-click-icon c-condition__delete-button icon-trash"
                    title="Delete this condition"
                    @click="removeCondition"
            ></button>
        </div>
    </div>
    <div v-if="expanded"
         class="c-cdef"
    >
        <span class="c-cdef__separator c-row-separator"></span>
        <span class="c-cdef__label">Condition Name</span>
        <span class="c-cdef__controls">
            <input v-model="domainObject.configuration.name"
                   class="t-condition-input__name"
                   type="text"
                   @blur="persist"
            >
        </span>

        <span class="c-cdef__label">Output</span>
        <span class="c-cdef__controls">
            <select v-model="selectedOutputSelection"
                    @change="setOutputValue"
            >
                <option value="">- Select Output -</option>
                <option v-for="option in outputOptions"
                        :key="option"
                        :value="option"
                >
                    {{ initCap(option) }}
                </option>
            </select>
            <input v-if="selectedOutputSelection === outputOptions[2]"
                   v-model="domainObject.configuration.output"
                   class="t-condition-name-input"
                   type="text"
                   @blur="persist"
            >
        </span>

        <div v-if="!domainObject.isDefault"
             class="c-cdef__match-and-criteria"
        >
            <span class="c-cdef__separator c-row-separator"></span>
            <span class="c-cdef__label">Match</span>
            <span class="c-cdef__controls">
                <select v-model="domainObject.configuration.trigger"
                        @change="persist"
                >
                    <option value="all">when all criteria are met</option>
                    <option value="any">when any criteria are met</option>
                </select>
            </span>

            <div v-for="(criterion, index) in domainObject.configuration.criteria"
                 :key="index"
                 class="c-cdef__criteria"
            >
                <span class="c-cdef__separator c-row-separator"></span>
                <Criterion :telemetry="telemetry"
                           :criterion="criterion"
                           :index="index"
                           :trigger="domainObject.configuration.trigger"
                           :is-default="domainObject.configuration.criteria.length === 1"
                           @persist="persist"
                />
                <div class="c-cdef__criteria__buttons">
                    <button class="c-click-icon c-cdef__criteria-duplicate-button icon-duplicate"
                            title="Duplicate this criteria"
                            @click="cloneCriterion(index)"
                    ></button>
                    <button v-if="!(domainObject.configuration.criteria.length === 1)"
                            class="c-click-icon c-cdef__criteria-duplicate-button icon-trash"
                            title="Delete this criteria"
                            @click="removeCriterion(index)"
                    ></button>
                </div>
            </div>

            <div class="c-cdef__separator c-row-separator"></div>
            <div class="c-cdef__controls">
                <button
                    class="c-cdef__add-criteria-button c-button c-button--labeled icon-plus"
                    @click="addCriteria"
                >
                    <span class="c-button__label">Add Criteria</span>
                </button>
            </div>
        </div>
    </div>
</div>
<div v-else
     id="conditionArea"
     class="c-condition js-condition-drag-wrapper"
     :class="{ 'widget-condition--current c-condition--current': currentConditionIdentifier && (currentConditionIdentifier.key === conditionIdentifier.key) }"
>
    <!-- Browse view -->
    <div class="title-bar">
        <span class="condition-name">
            {{ domainObject.configuration.name }}
        </span>
        <span class="condition-output">
            Output: {{ domainObject.configuration.output }}
        </span>
    </div>
    <div class="condition-config">
        <span class="condition-description">
            {{ domainObject.configuration.description }}
        </span>
    </div>
</div>
</template>

<script>
import Criterion from './Criterion.vue';

export default {
    inject: ['openmct'],
    components: {
        Criterion
    },
    props: {
        conditionIdentifier: {
            type: Object,
            required: true
        },
        currentConditionIdentifier: {
            type: Object,
            required: true
        },
        conditionIndex: {
            type: Number,
            required: true
        },
        isEditing: {
            type: Boolean,
            required: true
        },
        telemetry: {
            type: Array,
            required: true,
            default: () => []
        }
    },
    data() {
        return {
            domainObject: this.domainObject,
            currentCriteria: this.currentCriteria,
            expanded: true,
            trigger: 'all',
            selectedOutputSelection: '',
            outputOptions: ['false', 'true', 'string'],
            criterionIndex: 0
        };
    },
    destroyed() {
        this.destroy();
    },
    mounted() {
        this.openmct.objects.get(this.conditionIdentifier).then((domainObject => {
            this.domainObject = domainObject;
            this.initialize();
        }));
    },
    methods: {
        initialize() {
            this.setOutputSelection();
        },
        setOutputSelection() {
            let conditionOutput = this.domainObject.configuration.output;
            if (conditionOutput) {
                if (conditionOutput !== 'false' && conditionOutput !== 'true') {
                    this.selectedOutputSelection = 'string';
                } else {
                    this.selectedOutputSelection = conditionOutput;
                }
            }
        },
        setOutputValue() {
            if (this.selectedOutputSelection === 'string') {
                this.domainObject.configuration.output = '';
            } else {
                this.domainObject.configuration.output = this.selectedOutputSelection;
            }
            this.persist();
        },
        addCriteria() {
            const criteriaObject = {
                telemetry: '',
                operation: '',
                input: '',
                metadata: ''
            };
            this.domainObject.configuration.criteria.push(criteriaObject);
        },
        dragStart(e) {
            e.dataTransfer.setData('dragging', e.target); // required for FF to initiate drag
            e.dataTransfer.effectAllowed = "copyMove";
            e.dataTransfer.setDragImage(e.target.closest('.js-condition-drag-wrapper'), 0, 0);
            this.$emit('setMoveIndex', this.conditionIndex);
        },
        dragStop(e) {
            e.dataTransfer.clearData();
        },
        destroy() {
        },
        removeCondition(ev) {
            this.$emit('removeCondition', this.conditionIdentifier);
        },
        cloneCondition(ev) {
            this.$emit('cloneCondition', {
                identifier: this.conditionIdentifier,
                index: Number(ev.target.closest('.widget-condition').getAttribute('data-condition-index'))
            });
        },
        removeCriterion(index) {
            this.domainObject.configuration.criteria.splice(index, 1);
            this.persist()
        },
        cloneCriterion(index) {
            const clonedCriterion = {...this.domainObject.configuration.criteria[index]};
            this.domainObject.configuration.criteria.splice(index + 1, 0, clonedCriterion);
            this.persist()
        },
        hasTelemetry(identifier) {
            // TODO: check parent domainObject.composition.hasTelemetry
            return this.currentCriteria && identifier;
        },
        persist() {
            this.openmct.objects.mutate(this.domainObject, 'configuration', this.domainObject.configuration);
        },
        initCap: function (string) {
            return string.charAt(0).toUpperCase() + string.slice(1)
        }
    }
}
</script>


