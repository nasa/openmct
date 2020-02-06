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
                                           class="t-condition-input__name"
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
                                                :key="option"
                                                :value="option"
                                        >
                                            {{ option }}
                                        </option>
                                    </select>
                                    <input v-if="selectedOutputKey === outputOptions[2]"
                                           v-model="condition.definition.output"
                                           class="t-condition-input__output"
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
                                        <select v-model="trigger">
                                            <option value="all">all criteria are met</option>
                                            <option value="any">any criteria are met</option>
                                        </select>
                                    </span>
                                </li>
                            </ul>
                            <ul v-if="telemetry.length"
                                class="t-widget-condition-config">
                                <li v-for="(criteria, index) in condition.definition.criteria"
                                    :key="criteria.identifier.key"
                                    class="has-local-controls t-condition"
                                >
                                    <label>{{ index === 0 ? 'when' : 'and when' }}</label>
                                    <span class="t-configuration">
                                        <span class="controls">
                                            <select v-model="selectedTelemetryKey"
                                                    @change="updateTelemetryOptions"
                                            >
                                                <option value="">- Select Telemetry -</option>
                                                <option v-for="telemetryOption in telemetryObj"
                                                        :key="telemetryOption.identifier.key"
                                                        :value="telemetryOption.identifier"
                                                >
                                                    {{ telemetryOption.name }}
                                                </option>
                                            </select>
                                        </span>
                                        <span class="controls">
                                            <select @change="updateFieldOptions">
                                                <option value="">- Select Field -</option>
                                                <option v-for="option in telemetryMetadata[currentCriteria.identifier]"
                                                        :key="option.key"
                                                        :value="option.key"
                                                >
                                                    {{ option.name }}
                                                </option>
                                            </select>
                                        </span>
                                        <span class="controls">
                                            <select @change="updateComparisonOptions">
                                                <option value="">- Select Comparison -</option>
                                                <option v-for="option in operations"
                                                        :key="option.name"
                                                        :value="option.name"
                                                >
                                                    {{ option.text }}
                                                </option>
                                            </select>
                                            <input class="t-condition-name-input"
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
            currentCriteria: this.currentCriteria,
            expanded: true,
            trigger: 'any',
            telemetryObj: this.telemetry,
            telemetryMetadata: {},
            operations: OPERATIONS,
            selectedMetadataKey: {},
            selectedTelemetryKey: {},
            selectedOperationName: {},
            operationValue: {},
            selectedOutputKey: '',
            stringOutputField: {},
            comparisonInputValue: {},
            outputOptions: ['false', 'true', 'string']
            //     {
            //         key: 'false',
            //         text: 'False'
            //     },
            //     {
            //         key: 'true',
            //         text: 'True'
            //     },
            //     {
            //         key: 'string',
            //         text: 'String'
            //     }
            // ]
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
        addCriteria() {
            const criteriaObject = {
                operation: '',
                input: '',
                metadataKey: '',
                key: {
                    namespace: '',
                    key: uuid()
                }
            }
            this.selectedOperationName[this.currentCriteria.identifier] = undefined;
            // this.comparisonValueField[this.currentCriteria.identifier] = false;
            this.condition.definition.criteria.push(criteriaObject);
        },
        dragStart(e) {
            this.$emit('set-move-index', Number(e.target.getAttribute('data-condition-index')));
        },
        initialize() {
            if (this.condition.definition.criteria.length) {
                this.setCurrentCriterion(0);
                this.setOutput();
                this.updateTelemetryKeys();
                this.setOperation();
                this.conditionClass = new ConditionClass(this.condition, this.openmct);
                this.conditionClass.on('conditionResultUpdated', this.handleConditionResult.bind(this));
            }
        },
        setCurrentCriterion(index) {
            this.currentCriteria = this.condition.definition.criteria[index];
        },
        destroy() {
            // this.conditionClass.off('conditionResultUpdated', this.handleConditionResult.bind(this));
            // if (this.conditionClass && typeof this.conditionClass.destroy === 'function') {
            //     this.conditionClass.destroy();
            //     delete this.conditionClass;
            // }
        },
        reset() {
            this.selectedMetadataKey = {};
            this.selectedTelemetryKey = {};
            this.selectedOperationKey = {};
            this.operationValue = {};
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
        cloneCondition(ev) {
            this.$emit('cloneCondition', {
                identifier: this.conditionIdentifier,
                index: Number(ev.target.closest('.widget-condition').getAttribute('data-condition-index'))
            });
        },
        setOutput() {
            console.log('this.condition.definition.output', this.condition.definition.output === '');
            let conditionOutput = this.condition.definition.output;

            if (!conditionOutput) {
                if (conditionOutput !== 'false' && conditionOutput !== 'true') {
                    this.selectedOutputKey = this.outputOptions[2].key;
                } else {
                    if (conditionOutput === 'true') {
                        this.selectedOutputKey = this.outputOptions[1].key;
                    } else {
                        this.selectedOutputKey = this.outputOptions[0].key;
                    }
                }
                this.persist(); // maybe not needed
            }
        },
        setOperation() {
            if (this.selectedOperationName[this.currentCriteria.identifier] !== undefined) {
                if (this.operationValue[this.currentCriteria.identifier] !== undefined) {
                    for (let i=0, ii=this.operations.length; i < ii; i++) {
                        if (this.currentCriteria.operation === this.operations[i].name) {
                            this.selectedOperationName[this.currentCriteria.identifier] = this.operations[i].name;

                            this.comparisonInputValue[this.currentCriteria.identifier] = this.operations[i].inputCount > 0;
                            if (this.comparisonInputValue[this.currentCriteria.identifier]) {
                                this.operationValue[this.currentCriteria.identifier] = this.currentCriteria.input[0];
                            }
                        }
                    }
                }
            }
        },
        updateTelemetryKeys() {
            console.log('updateTelemetryKeys')
            if (this.hasTelemetry()) {
                this.openmct.objects.get(this.currentCriteria.identifier).then((obj) => {
                    this.telemetryMetadata[this.currentCriteria.identifier] = this.openmct.telemetry.getMetadata(obj).values();
                    this.selectedMetadataKey[this.currentCriteria.identifier] = this.getTelemetryMetadataKey();
                    this.selectedTelemetryKey[this.currentCriteria.identifier] = this.getTelemetryKey();
                    console.log('this.telemetryMetadata[this.currentCriteria.identifier]', this.telemetryMetadata[this.currentCriteria.identifier])
                    console.log('this.selectedMetadataKey[this.currentCriteria.identifier]', this.selectedMetadataKey[this.currentCriteria.identifier])
                    console.log('this.selectedTelemetryKey[this.currentCriteria.identifier]', this.selectedTelemetryKey[this.currentCriteria.identifier])
                });
            }
        },
        getTelemetryMetadataKey() {
            // console.log('this.telemetryMetadata[this.currentCriteria.identifier]', this.telemetryMetadata[this.currentCriteria.identifier]);
            let index = -1;
            if (this.currentCriteria.identifier) {
                index = _.findIndex(this.telemetryMetadata[this.currentCriteria.identifier], (metadata) => {
                    return metadata.key === this.currentCriteria.metadataKey;
                });
            }
            return this.telemetryMetadata[this.currentCriteria.identifier].length && index > -1 ? this.telemetryMetadata[this.currentCriteria.identifier][index].key : '- Select Telemetry -';
        },
        getTelemetryKey() {
            let index = -1;
            if (this.currentCriteria && this.currentCriteria.identifier) {
                let conditionKey = this.openmct.objects.makeKeyString(this.currentCriteria.identifier);
                index = _.findIndex(this.telemetry, (obj) => {
                    let key = this.openmct.objects.makeKeyString(obj.identifier)
                    return key === conditionKey
                });
            }
            console.log('index', index, 'this.telemetry[index]', this.telemetry[index]);
            return this.telemetry.length && index > -1 ? this.telemetry[index] : '';
        },
        hasTelemetry() {
            // console.log('this.domainObject.composition', this.domainObject.composition);
            return this.currentCriteria && this.currentCriteria.identifier;
        },
        updateConditionCriteria() {
            if (this.condition.definition.criteria.length) {
                let criterion = this.condition.definition.criteria[0];
                criterion.key = this.selectedTelemetryKey[this.currentCriteria.identifier];
                criterion.metadataKey = this.selectedMetadataKey[this.currentCriteria.identifier];
                criterion.operation = this.selectedOperationName[this.currentCriteria.identifier];
                criterion.input = this.operationValue;
            }
        },
        persist() {
            // this.updateConditionCriteria();
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
        updateOutputOption(ev) {
            if (this.selectedOutputKey === this.outputOptions[2].key) {
                this.condition.definition.output = '';
            } else {
                this.condition.definition.output = this.selectedOutputKey;
            }
        },
        // I'm thinking the update select options handlers should call different functions
        updateTelemetryOptions() {
            this.updateConditionCriteria();
            this.updateTelemetryKeys();
        },
        updateFieldOptions() {
            this.updateConditionCriteria();
            this.updateTelemetryKeys();
        },
        updateComparisonOptions(ev) {
            if (ev.target.value !== undefined) {
                this.operationValue[this.currentCriteria.identifier] = ev.target.value;
                // for (let i = 0, ii = this.operations.length; i < ii; i++) {
                //     // console.log('this.selectedOperationName[this.currentCriteria.identifier]', this.selectedOperationName[this.currentCriteria.identifier])
                //     // console.log('this.operations[i].name', this.operations[i].name)
                //     if (this.selectedOperationName[this.currentCriteria.identifier] === this.operations[i].name) {
                //         // console.log('this.operations[i].inputCount', this.operations[i].inputCount);
                //         //this.comparisonValueField[this.currentCriteria.identifier] = this.operations[i].inputCount > 0;
                //         console.log('this.comparisonValueField[this.currentCriteria.identifier]', this.comparisonValueField[this.currentCriteria.identifier]);
                //         break;
                //     }
                // }
            } else {
                this.operationValue[this.currentCriteria.identifier] = undefined;
            }
        },

        updateCurrentCondition() {
            this.$emit('updateCurrentCondition', this.conditionIdentifier);
        }
    }
}
</script>


