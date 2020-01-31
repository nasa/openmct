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
<!-- TODO: current condition class should be set using openmct.objects.makeKeyString(<identifier>) -->
<div v-if="condition"
     class="c-c-editui__conditions c-c-container__container c-c__drag-wrapper"
     :class="['widget-condition', { 'widget-condition--current': currentConditionIdentifier && (currentConditionIdentifier.key === conditionIdentifier.key) }]"
>
    <div class="title-bar">
        <span class="c-c__menu-hamburger"
              :class="{ 'is-enabled': !condition.isDefault }"
              :draggable="!condition.isDefault"
              @dragstart="dragStart"
              @dragover.stop
        ></span>
        <span
            class="is-enabled flex-elem"
            :class="['c-c__disclosure-triangle', { 'c-c__disclosure-triangle--expanded': expanded }]"
            @click="expanded = !expanded"
        ></span>
        <div class="condition-summary">
            <span class="condition-name">{{ condition.definition.name }}</span>
            <!-- TODO: description should be derived from criteria -->
            <span class="condition-description">{{ condition.definition.name }}</span>
        </div>
        <span v-if="!condition.isDefault"
              class="is-enabled c-c__duplicate"
        ></span>
        <span v-if="!condition.isDefault"
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
                                    <input v-model="condition.definition.name"
                                           class="t-condition-name-input"
                                           type="text"
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
                                                :key="option.key"
                                                :value="option.key"
                                        >
                                            {{ option.text }}
                                        </option>
                                    </select>
                                    <input v-if="selectedOutputKey === outputOptions[2].key"
                                           v-model="condition.definition.output"
                                           class="t-condition-name-input"
                                           type="text"
                                    >
                                </span>
                            </li>
                        </ul>
                        <div v-if="!condition.isDefault"
                             class="widget-condition-content expanded"
                        >
                            <ul class="t-widget-condition-config">
                                <li class="has-local-controls t-condition">
                                    <label>Match when</label>
                                    <span class="controls">
                                        <select>
                                            <option value="all">all criteria are met</option>
                                            <option value="any">any criteria are met</option>
                                        </select>
                                    </span>
                                </li>
                            </ul>
<<<<<<< HEAD
                            <ul class="t-widget-condition-config">
=======
                            <ul class="t-widget-rule-config">
>>>>>>> 25bdaa695b842aed8a9c5b8b381f2f5063d5e591
                                <li v-if="telemetry.length"
                                    class="has-local-controls t-condition"
                                >
                                    <label>when</label>
                                    <span class="t-configuration">
                                        <span class="controls">
                                            <select v-model="selectedTelemetryKey"
                                                    @change="updateTelemetryMetaData"
                                            >
                                                <option value="">- Select Telemetry -</option>
                                                <option v-for="telemetryOption in telemetry"
                                                        :key="telemetryOption.identifier.key"
                                                        :value="telemetryOption.identifier"
                                                >
                                                    {{ telemetryOption.name }}
                                                </option>
                                            </select>
                                        </span>
                                        <span class="controls">
                                            <select v-model="selectedMetaDataKey">
                                                <option value="">- Select Field -</option>
                                                <option v-for="option in telemetryMetadata"
                                                        :key="option.key"
                                                        :value="option.key"
                                                >
                                                    {{ option.name }}
                                                </option>
                                            </select>
                                        </span>
                                        <span class="controls">
                                            <select v-model="selectOperationName"
                                                    @change="setInputValueVisibility"
                                            >
                                                <option value="">- Select Comparison -</option>
                                                <option v-for="option in operations"
                                                        :key="option.name"
                                                        :value="option.name"
                                                >
                                                    {{ option.text }}
                                                </option>
                                            </select>
                                            <input v-if="comparisonValueField"
                                                   class="t-condition-name-input"
                                                   type="text"
                                                   v-model="operationValue"
                                            >
                                        </span>
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
</div>
</template>

<script>
import { OPERATIONS } from '../utils/operations';
import ConditionClass from "@/plugins/condition/Condition";

export default {
    inject: ['openmct', 'domainObject'],
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
        telemetry: {
            type: Array,
            required: true,
            default: () => []
        }
    },
    data() {
        return {
            condition: this.condition,
            expanded: true,
            telemetryObject: this.telemetryObject,
            telemetryMetadata: this.telemetryMetadata,
            operations: OPERATIONS,
            selectedMetaDataKey: '',
            selectedTelemetryKey: '',
            selectOperationName: '',
            selectedOutputKey: '',
            stringOutputField: false,
            comparisonValueField: false,
            operationValue: this.operationValue,
            outputOptions: [
                {
                    key: 'false',
                    text: 'False'
                },
                {
                    key: 'true',
                    text: 'True'
                },
                {
                    key: 'string',
                    text: 'String'
                }
            ]

        };
    },
    destroyed() {
        this.destroy();
    },
    mounted() {
        this.openmct.objects.get(this.conditionIdentifier).then((obj => {
            this.condition = obj;
            this.initialize();
        }));
    },
    updated() {
        //validate telemetry exists, update criteria as needed
        this.validate();
        this.persist();
    },
    methods: {
        dragStart(e) {
            e.dataTransfer.effectAllowed = "copyMove";
            e.dataTransfer.setDragImage(e.target.closest('.c-c-container__container'), 0, 0);
            this.$emit('setMoveIndex', this.conditionIndex);
        },
        initialize() {
            this.setOutput();
            this.setOperation();
            this.updateTelemetry();
            this.conditionClass = new ConditionClass(this.condition, this.openmct);
            this.conditionClass.on('conditionResultUpdated', this.handleConditionResult.bind(this));
        },
        destroy() {
            this.conditionClass.off('conditionResultUpdated', this.handleConditionResult.bind(this));
            if (this.conditionClass && typeof this.conditionClass.destroy === 'function') {
                this.conditionClass.destroy();
                delete this.conditionClass;
            }
        },
        reset() {
            this.selectedMetaDataKey = '';
            this.selectedTelemetryKey = '';
            this.selectOperationName = '';
            this.operationValue = '';
        },
        validate() {
            if (this.hasTelemetry() && !this.getTelemetryKey()) {
                this.reset();
            } else {
                if (!this.conditionClass) {
                    this.initialize();
                }
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
        setOutput() {
            let conditionOutput = this.condition.definition.output;
            if (conditionOutput !== 'false' && conditionOutput !== 'true') {
                this.selectedOutputKey = this.outputOptions[2].key;
            } else {
                if (conditionOutput === 'true') {
                    this.selectedOutputKey = this.outputOptions[1].key;
                } else {
                    this.selectedOutputKey = this.outputOptions[0].key;
                }
            }
        },
        setOperation() {
            if (this.condition.definition.criteria.length && this.condition.definition.criteria[0].operation) {
                for (let i=0, ii=this.operations.length; i < ii; i++) {
                    if (this.condition.definition.criteria[0].operation === this.operations[i].name) {
                        this.selectOperationName = this.operations[i].name;
                        this.comparisonValueField = this.operations[i].inputCount > 0;
                        if (this.comparisonValueField) {
                            this.operationValue = this.condition.definition.criteria[0].input[0];
                        }
                    }
                }
            }
        },
        updateTelemetry() {
            if (this.hasTelemetry()) {
                this.openmct.objects.get(this.condition.definition.criteria[0].key).then((obj) => {
                    this.telemetryObject = obj;
                    this.telemetryMetadata = this.openmct.telemetry.getMetadata(this.telemetryObject).values();
                    this.selectedMetaDataKey = this.getTelemetryMetadataKey();
                    this.selectedTelemetryKey = this.getTelemetryKey();
                });
            } else {
                this.telemetryObject = null;
            }
        },
        getTelemetryMetadataKey() {
            let index = -1;
            if (this.condition.definition.criteria[0].metaDataKey) {
                index = _.findIndex(this.telemetryMetadata, (metadata) => {
                    return metadata.key === this.condition.definition.criteria[0].metaDataKey;
                });
            }
            return this.telemetryMetadata.length && index > -1 ? this.telemetryMetadata[index].key : '';
        },
        getTelemetryKey() {
            let index = -1;
            if (this.condition.definition.criteria[0].key) {
                index = _.findIndex(this.telemetry, (obj) => {
                    let key = this.openmct.objects.makeKeyString(obj.identifier);
                    let conditionKey = this.openmct.objects.makeKeyString(this.condition.definition.criteria[0].key);
                    return key === conditionKey;
                });
            }
            return this.telemetry.length && index > -1 ? this.telemetry[index].identifier : '';
        },
        hasTelemetry() {
            return this.condition.definition.criteria.length && this.condition.definition.criteria[0].key;
        },
        updateConditionCriteria() {
            if (this.condition.definition.criteria.length) {
                let criterion = this.condition.definition.criteria[0];
                criterion.key = this.selectedTelemetryKey;
                criterion.metaDataKey = this.selectedMetaDataKey;
                criterion.operation = this.selectOperationName;
                criterion.input = [this.operationValue];
            }
        },
        persist() {
            this.updateConditionCriteria();
            this.openmct.objects.mutate(this.condition, 'definition', this.condition.definition);
        },
        checkInputValue() {
            if (this.selectedOutputKey === this.outputOptions[2].key) {
                this.condition.definition.output = '';
            } else {
                this.condition.definition.output = this.selectedOutputKey;
            }
        },
        setInputValueVisibility(ev) {
            for (let i=0, ii=this.operations.length; i < ii; i++) {
                if (this.selectOperationName === this.operations[i].name) {
                    this.comparisonValueField = this.operations[i].inputCount > 0;
                    break;
                }
            }
            //find the criterion being updated and set the operation property
        },
        updateTelemetryMetaData() {
            this.selectedMetaDataKey = '';
            this.updateConditionCriteria();
            this.updateTelemetry();
        },
        updateCurrentCondition() {
            this.$emit('updateCurrentCondition', this.conditionIdentifier);
        }
    }
}
</script>
