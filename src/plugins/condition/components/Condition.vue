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
<div v-if="isEditing">
    <div v-if="domainObject"
         class="c-c-editui__conditions c-c-container__container c-c__drag-wrapper"
         :class="['widget-condition', { 'widget-condition--current': currentConditionIdentifier && (currentConditionIdentifier.key === conditionIdentifier.key) }]"
    >
        <div class="title-bar">
            <span class="c-c__menu-hamburger"
                  :class="{ 'is-enabled': !domainObject.isDefault }"
                  :draggable="!domainObject.isDefault"
                  @dragstart="dragStart"
                  @dragover.stop
            ></span>
            <span
                class="is-enabled flex-elem"
                :class="['c-c__disclosure-triangle', { 'c-c__disclosure-triangle--expanded': expanded }]"
                @click="expanded = !expanded"
            ></span>
            <div class="condition-summary">
                <span class="condition-name">{{ domainObject.configuration.name }}</span>
                <!-- TODO: description should be derived from criteria -->
                <span class="condition-description">{{ domainObject.configuration.name }}</span>
            </div>
            <span v-if="!domainObject.isDefault"
                  class="is-enabled c-c__duplicate"
                  @click="cloneCondition"
            ></span>
            <span v-if="!domainObject.isDefault"
                  class="is-enabled c-c__trash"
                  @click="removeCondition"
            ></span>
        </div>
        <div v-if="expanded"
             class="condition-config-edit widget-condition-content c-sw-editui__conditions-wrapper holder widget-conditions-wrapper flex-elem expanded"
        >
            <div id="conditionArea"
                 class="c-c-editui__condition widget-conditions"
            >
                <div class="c-c-condition">
                    <div class="c-c-condition__ui l-compact-form l-widget-condition has-local-controls">
                        <div>
                            <ul class="t-widget-condition-config">
                                <li>
                                    <label>Condition Name</label>
                                    <span class="controls">
                                        <input v-model="domainObject.configuration.name"
                                               class="t-condition-input__name"
                                               type="text"
                                               @blur="persist"
                                        >
                                    </span>
                                </li>
                                <li>
                                    <label>Output</label>
                                    <span class="controls">
                                        <select v-model="selectedOutputKey"
                                                @change="checkInputValue"
                                        >
                                            <option value="">- Select Output -</option>
                                            <option v-for="option in outputOptions"
                                                    :key="option"
                                                    :value="option"
                                            >
                                                {{ option.charAt(0).toUpperCase() + option.slice(1) }}
                                            </option>
                                        </select>
                                        <input v-if="selectedOutputKey === outputOptions[2]"
                                               v-model="domainObject.configuration.output"
                                               class="t-condition-name-input"
                                               type="text"
                                               @blur="persist"
                                        >
                                    </span>
                                </li>
                            </ul>
                            <div v-if="!domainObject.isDefault"
                                 class="widget-condition-content expanded"
                            >
                                <ul class="t-widget-condition-config">
                                    <li class="has-local-controls t-condition">
                                        <label>Match when</label>
                                        <span class="controls">
                                            <select v-model="trigger">
                                                <option value="all">all criteria are met</option>
                                                <option value="any">any criteria are met</option>
                                            </select>
                                        </span>
                                    </li>
                                </ul>
                                <ul v-if="telemetry.length"
                                    class="t-widget-condition-config"
                                >
                                    <Criterion v-for="(criterion, index) in domainObject.configuration.criteria"
                                               :key="index"
                                               :telemetry="telemetry"
                                               :criterion="criterion"
                                               :index="index"
                                               :trigger="trigger"
                                               @persist="persist"
                                    />
                                </ul>
                                <div class="holder c-c-button-wrapper align-left">
                                    <span class="c-c-label-spacer"></span>
                                    <button
                                        class="c-c-button c-c-button--minor add-criteria-button"
                                        @click="addCriteria"
                                    >
                                        <span class="c-c-button__label">Add Criteria</span>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
<div v-else>
    <div v-if="domainObject"
         id="conditionArea"
         class="c-cs-ui__conditions"
         :class="['widget-condition', { 'widget-condition--current': currentConditionIdentifier && (currentConditionIdentifier.key === conditionIdentifier.key) }]"
    >
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
</div>
</template>

<script>
import ConditionClass from "@/plugins/condition/Condition";
import Criterion from '../../condition/components/Criterion.vue';

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
            selectedOutputKey: '',
            stringOutputField: false,
            outputOptions: ['false', 'true', 'string']
        };
    },
    computed: {
        initCap: function (string) {
            return string.charAt(0).toUpperCase() + string.slice(1)
        }
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
            this.setOutput();
            if (!this.domainObject.isDefault) {
                this.conditionClass = new ConditionClass(this.domainObject, this.openmct);
                this.conditionClass.on('conditionResultUpdated', this.handleConditionResult.bind(this));
            }
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
            e.dataTransfer.setDragImage(e.target.closest('.c-c-container__container'), 0, 0);
            this.$emit('setMoveIndex', this.conditionIndex);
        },
        destroy() {
            if (this.conditionClass) {
                this.conditionClass.off('conditionResultUpdated', this.handleConditionResult.bind(this));
                if (typeof this.conditionClass.destroy === 'function') {
                    this.conditionClass.destroy();
                }
                delete this.conditionClass;
            }
        },
        handleConditionResult(args) {
            this.$emit('conditionResultUpdated', {
                id: this.conditionIdentifier,
                result: args.data.result
            })
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
        setOutput() {
            let conditionOutput = this.domainObject.configuration.output;
            if (conditionOutput) {
                if (conditionOutput !== 'false' && conditionOutput !== 'true') {
                    this.selectedOutputKey = 'string';
                } else {
                    this.selectedOutputKey = conditionOutput;
                }
            }
        },
        persist() {
            this.openmct.objects.mutate(this.domainObject, 'configuration', this.domainObject.configuration);
        },
        checkInputValue() {
            if (this.selectedOutputKey === 'string') {
                this.domainObject.configuration.output = '';
            } else {
                this.domainObject.configuration.output = this.selectedOutputKey;
            }
        },
        updateCurrentCondition() {
            this.$emit('updateCurrentCondition', this.currentConditionIdentifier);
        },
        hasTelemetry(identifier) {
            // TODO: check parent domainObject.composition.hasTelemetry
            return this.currentCriteria && identifier;
        }
    }
}
</script>


