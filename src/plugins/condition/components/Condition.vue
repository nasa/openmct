<template>
<div v-if="isEditing">
    <div v-if="domainObject"
         class="c-c-editui__conditions c-c-container__container c-c__drag-wrapper"
         :class="['widget-condition', { 'widget-condition--current': currentConditionIdentifier && (currentConditionIdentifier.key === conditionIdentifier.key) }]"
         :data-condition-index="conditionIndex"
         :draggable="!domainObject.isDefault"
         @dragstart="dragStart"
         @dragover.stop
    >
        <div class="title-bar">
            <span
                class="c-c__menu-hamburger"
                :class="{ 'is-enabled': !domainObject.isDefault }"
            ></span>
            <span
                class="is-enabled flex-elem"
                :class="['c-c__disclosure-triangle', { 'c-c__disclosure-triangle--expanded': expanded }]"
                @click="expanded = !expanded"
            ></span>
            <div class="condition-summary">
                <span class="condition-name">{{ domainObject.configuration.name }}</span>
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
                                               v-model="domainObject.configuration.output"
                                               class="t-condition-input__output"
                                               type="text"
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
                                    <li v-for="(criteria, index) in domainObject.configuration.criteria"
                                        :key="criteria.identifier.key"
                                        class="has-local-controls t-condition"
                                    >
                                        <label>{{ index === 0 ? 'when' : 'and when' }}</label>
                                        <span class="t-configuration">
                                            <span class="controls">
                                                <select v-model="selectedTelemetryObject">
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
                                                <select v-model="selectedFieldObject">
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
                                                <select v-model="selectedOperationObject">
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
import { OPERATIONS } from '../utils/operations';
import ConditionClass from "@/plugins/condition/Condition";
import uuid from 'uuid';

export default {
    inject: ['openmct'],
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
        },
        isEditing: {
            type: Boolean,
            required: true
        }
    },
    data() {
        return {
            domainObject: this.domainObject,
            currentCriteria: this.currentCriteria,
            expanded: true,
            trigger: 'any',
            telemetryObj: this.telemetry,
            telemetryMetadata: {},
            operations: OPERATIONS,
            selectedTelemetryObject: {},
            selectedFieldObject: {},
            selectedOperationObject: {},
            operationValue: {},
            selectedOutputKey: '',
            stringOutputField: {},
            comparisonInputValue: {},
            outputOptions: ['false', 'true', 'string']
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
            // this.comparisonValueField[id] = false;
            this.domainObject.configuration.criteria.push(criteriaObject);
        },
        dragStart(e) {
            this.$emit('set-move-index', Number(e.target.getAttribute('data-condition-index')));
        },
        initialize() {
            let criteriaId;
            if (!this.domainObject.isDefault) {
                this.setCurrentCriterion(0);
                criteriaId = this.currentCriteria.identifier;
                this.setOutput(criteriaId);
                this.updateTelemetryObjects(criteriaId);
                this.setOperationObject(criteriaId);
                this.conditionClass = new ConditionClass(this.domainObject, this.openmct);
                this.conditionClass.on('conditionResultUpdated', this.handleConditionResult.bind(this));
            }
        },
        setCurrentCriterion(index) {
            console.log('this.domainObject.configuration', this.domainObject.configuration);
            this.currentCriteria = this.domainObject.configuration.criteria[index];
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
        validate(criteriaId) {
            if (this.hasTelemetry(criteriaId) && !this.getTelemetryKey(criteriaId)) {
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
        setOutput(value) {
            let conditionOutput = this.domainObject.configuration.output;

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
            }
        },
        setOperationObject(criteriaId) {
            if (this.selectedFieldObject[criteriaId] !== undefined) {
                if (this.operationValue[criteriaId] !== undefined) {
                    for (let i=0, ii=this.operations.length; i < ii; i++) {
                        if (this.currentCriteria.operation === this.operations[i].name) {
                            this.selectedFieldObject[criteriaId] = this.operations[i].name;

                            this.comparisonInputValue[criteriaId] = this.operations[i].inputCount > 0;
                            if (this.comparisonInputValue[criteriaId]) {
                                this.operationValue[criteriaId] = this.currentCriteria.input[0];
                            }
                        }
                    }
                }
            }
        },
        updateTelemetryObjects(criteriaId) {
            if (this.hasTelemetry(criteriaId)) {
                this.openmct.objects.get(criteriaId).then((obj) => {
                    this.telemetryMetadata[criteriaId] = this.openmct.telemetry.getMetadata(obj).values();
                    this.selectedFieldObject[criteriaId] = this.getTelemetryMetadataKey(criteriaId);
                    this.selectedTelemetryObject[criteriaId] = this.getTelemetryObject(criteriaId);
                    // console.log('this.telemetryMetadata[criteriaId]', this.telemetryMetadata[criteriaId])
                    // console.log('this.selectedMetadataKey[criteriaId]', this.selectedMetadataKey[criteriaId])
                    console.log('this.selectedTelemetryObject[criteriaId]', this.selectedTelemetryObject[criteriaId])
                });
            }
        },
        getTelemetryMetadataKey(criteriaId) {
            let index = -1;
            if (criteriaId) {
                index = _.findIndex(this.telemetryMetadata[criteriaId], (metadata) => {
                    return metadata.key === this.currentCriteria.metadataKey;
                });
            }
            return this.telemetryMetadata[criteriaId].length && index > -1 ? this.telemetryMetadata[criteriaId][index].key : '- Select Telemetry -';
        },
        getTelemetryObject(criteriaId) {
            let index = -1;
            if (this.currentCriteria && criteriaId) {
                let conditionKey = this.openmct.objects.makeKeyString(criteriaId);
                index = _.findIndex(this.telemetry, (obj) => {
                    let key = this.openmct.objects.makeKeyString(obj.identifier)
                    return key === conditionKey
                });
            }
            return this.telemetry.length && index > -1 ? this.telemetry[index] : '';
        },
        hasTelemetry(criteriaId) {
            // TODO: check parent domainObject.composition.hasTelemetry
            return this.currentCriteria && criteriaId;
        },
        updateConditionCriteria(criteriaId) {
            if (this.domainObject.configuration.criteria.length) {
                let criterion = this.domainObject.configuration.criteria[0];
                criterion.key = this.selectedTelemetryKey[criteriaId];
                criterion.metadataKey = this.selectedMetadataKey[criteriaId];
                criterion.operation = this.selectedOperationName[criteriaId];
                criterion.input = this.operationValue;
            }
        },
        persist() {
            // this.updateConditionCriteria();
            this.openmct.objects.mutate(this.domainObject, 'configuration', this.domainObject.configuration);
        },
        checkInputValue() {
            if (this.selectedOutputKey === this.outputOptions[2].key) {
                this.domainObject.configuration.output = '';
            } else {
                this.domainObject.configuration.output = this.selectedOutputKey;
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
                this.domainObject.configuration.output = '';
            } else {
                this.domainObject.configuration.output = this.selectedOutputKey;
            }
        },
        // // I'm thinking the update select options handlers should call different functions
        // updateTelemetryOptions() {
        //     this.updateConditionCriteria();
        //     this.updateTelemetryKeys();
        // },
        // updateFieldOptions() {
        //     this.updateConditionCriteria();
        //     this.updateTelemetryKeys();
        // },
        // updateComparisonOptions(ev, criteriaId) {
        //     if (ev.target.value !== undefined) {
        //         this.operationValue[criteriaId] = ev.target.value;
        //         // for (let i = 0, ii = this.operations.length; i < ii; i++) {
        //         //     // console.log('this.selectedOperationName[criteriaId]', this.selectedOperationName[criteriaId])
        //         //     // console.log('this.operations[i].name', this.operations[i].name)
        //         //     if (this.selectedOperationName[criteriaId] === this.operations[i].name) {
        //         //         // console.log('this.operations[i].inputCount', this.operations[i].inputCount);
        //         //         //this.comparisonValueField[criteriaId] = this.operations[i].inputCount > 0;
        //         //         console.log('this.comparisonValueField[criteriaId]', this.comparisonValueField[criteriaId]);
        //         //         break;
        //         //     }
        //         // }
        //     } else {
        //         this.operationValue[criteriaId] = undefined;
        //     }
        // },

        updateCurrentCondition() {
            this.$emit('updateCurrentCondition', this.conditionIdentifier);
        }
    }
}
</script>


