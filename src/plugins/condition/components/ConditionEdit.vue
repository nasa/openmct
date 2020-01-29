<template>
<div v-if="condition"
     class="c-c-editui__conditions c-c-container__container c-c__drag-wrapper"
     :class="['widget-condition', { 'widget-condition--current': currentConditionIdentifier && (currentConditionIdentifier.key === conditionIdentifier.key) }]"
     :data-condition-index="conditionIndex"
     :draggable="!condition.isDefault"
     @dragstart="dragStart"
     @dragover.stop
>
    <div class="title-bar">
        <span
            class="c-c__menu-hamburger"
            :class="{ 'is-enabled': !condition.isDefault }"
        ></span>
        <span
            class="is-enabled flex-elem"
            :class="['c-c__disclosure-triangle', { 'c-c__disclosure-triangle--expanded': expanded }]"
            @click="expanded = !expanded"
        ></span>
        <div class="condition-summary">
            <span class="condition-name">{{ condition.definition.name }}</span>
            <span class="condition-description">{{ condition.definition.name }}</span>
        </div>
        <span v-if="!condition.isDefault"
              class="is-enabled c-c__duplicate"
              @click="cloneCondition"
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
                            <ul v-if="telemetry.length"
                                class="t-widget-condition-config">
                                <li v-for="(criteria, index) in condition.definition.criteria"
=======
                            <ul class="t-widget-rule-config"
                                v-if="telemetry.length">
                                <li v-for="criteria in condition.definition.criteria"
>>>>>>> f25eebdf3f51d50f1fd180e4350fb0566f02e39f
                                    :key="criteria.key.key"
                                    class="has-local-controls t-condition"
                                >
                                    <label>{{ index === 0 ? 'when' : 'and when' }}</label>
                                    <span class="t-configuration">
                                        <span class="controls">
                                            <select v-model="selectedTelemetryKey[criteria.key.key]"
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
                                            <select v-model="selectedOperationKey"
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
                                                   v-model="operationValue"
                                                   class="t-condition-name-input"
                                                   type="text"
                                            >
                                        </span>
                                    </span>
                                </li>
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
</template>

<script>
import { OPERATIONS } from '../utils/operations';
import ConditionClass from "@/plugins/condition/Condition";
import uuid from 'uuid';

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
            selectedMetaDataKey: {},
            selectedTelemetryKey: {},
            selectedOperationKey: '',
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

        this.dragGhost = document.getElementById('js-c-drag-ghost');
    },
    updated() {
        //validate telemetry exists, update criteria as needed
        this.validate();
        this.persist();
    },
    methods: {
        addCriteria() {
            const criteriaObject = {
                operation: '',
                input: '',
                metaDataKey: '',
                key: {
                    namespace: '',
                    key: uuid()
                }
            }
            this.condition.definition.criteria.push(criteriaObject);
            console.log('this.condition.definition.criteria', this.condition.definition.criteria);
        },
        dragStart(e) {
            this.$emit('set-move-index', Number(e.target.getAttribute('data-condition-index')));
        },
        initialize() {
            this.condition.definition.criteria.push({
                operation: '',
                input: '',
                metaDataKey: '',
                key: {
                    namespace: '',
                    key: uuid()
                }
            });
            if(this.condition.definition.criteria.length) {
                this.setCurrentCriterion(0);
            }
            this.setOutput();
            this.setOperation();
            this.updateTelemetry();
            this.conditionClass = new ConditionClass(this.condition, this.openmct);
            this.conditionClass.on('conditionResultUpdated', this.handleConditionResult.bind(this));
        },
        setCurrentCriterion(index) {
            this.currentCriteria = this.condition.definition.criteria[index];
        },
        destroy() {
            this.conditionClass.off('conditionResultUpdated', this.handleConditionResult.bind(this));
            if (this.conditionClass && typeof this.conditionClass.destroy === 'function') {
                this.conditionClass.destroy();
                delete this.conditionClass;
            }
        },
        reset() {
            this.selectedMetaDataKey = {};
            this.selectedTelemetryKey = {};
            this.selectedOperationKey = '';
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
            this.$emit('condition-result-updated', {
                id: this.conditionIdentifier,
                result: args.data.result
            })
        },
        removeCondition(ev) {
            this.$emit('remove-condition', this.conditionIdentifier);
        },
        cloneCondition(ev) {
            this.$emit('clone-condition', {
                identifier: this.conditionIdentifier,
                index: Number(ev.target.closest('.widget-condition').getAttribute('data-condition-index'))
            });
        },
        setOutput() {
            if (this.condition.definition.output !== 'false' && this.condition.definition.output !== 'true') {
                this.selectedOutputKey = this.outputOptions[2].key;
            } else {
                if (this.condition.definition.output === 'true') {
                    this.selectedOutputKey = this.outputOptions[1].key;
                } else {
                    this.selectedOutputKey = this.outputOptions[0].key;
                }
            }
        },
        setOperation() {
            if (this.currentCriteria && this.currentCriteria.operation) {
                for (let i=0, ii=this.operations.length; i < ii; i++) {
                    if (this.currentCriteria.operation === this.operations[i].name) {
                        this.selectedOperationKey = this.operations[i].name;
                        this.comparisonValueField = this.operations[i].inputCount > 0;
                        if (this.comparisonValueField) {
                            this.operationValue = this.currentCriteria.input[0];
                        }
                    }
                }
            }
        },
        updateTelemetry() {
            if (this.hasTelemetry()) {
                this.openmct.objects.get(this.currentCriteria.key).then((obj) => {
                    this.telemetryObject = obj;
                    this.telemetryMetadata = this.openmct.telemetry.getMetadata(this.telemetryObject).values();
                    this.selectedMetaDataKey = this.getTelemetryMetadataKey();
                    this.selectedTelemetryKey[this.currentCriteria.key] = this.getTelemetryKey();
                });
            } else {
                this.telemetryObject = null;
            }
        },
        getTelemetryMetadataKey() {
            let index = -1;
            if (this.currentCriteria.metaDataKey) {
                index = _.findIndex(this.telemetryMetadata, (metadata) => {
                    return metadata.key === this.currentCriteria.metaDataKey;
                });
            }
            return this.telemetryMetadata.length && index > -1 ? this.telemetryMetadata[index].key : '';
        },
        getTelemetryKey() {
            let index = -1;
            if (this.currentCriteria.key) {
                index = _.findIndex(this.telemetry, (obj) => {
                    let key = this.openmct.objects.makeKeyString(obj.identifier);
                    let conditionKey = this.openmct.objects.makeKeyString(this.currentCriteria.key);
                    return key === conditionKey;
                });
            }
            return this.telemetry.length && index > -1 ? this.telemetry[index].identifier : '';
        },
        hasTelemetry() {
            return this.currentCriteria && this.currentCriteria.key;
        },
        updateConditionCriteria() {
            if (this.currentCriteria) {
                this.currentCriteria.key = this.selectedTelemetryKey;
                this.currentCriteria.metaDataKey = this.selectedMetaDataKey;
                this.currentCriteria.operation = this.selectedOperationKey;
                this.currentCriteria.input = [this.operationValue];
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
            if (this.selectedOperationKey !== 'isUndefined' && this.selectedOperationKey !== 'isDefined') {
                this.comparisonValueField = true;
            } else {
                this.comparisonValueField = false;
            }
            //find the criterion being updated and set the operation property
        },
        updateTelemetryMetaData() {
            this.selectedMetaDataKey = '';
            this.updateConditionCriteria();
            this.updateTelemetry();
        },
        updateCurrentCondition() {
            this.$emit('update-current-condition', this.conditionIdentifier);
        }
    }
}
</script>

