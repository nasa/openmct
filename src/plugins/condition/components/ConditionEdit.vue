<template>
<div v-if="condition"
     class="c-cs-editui__conditions"
     :class="['widget-condition', { 'widget-condition--current': currentConditionIdentifier && (currentConditionIdentifier.key === conditionIdentifier.key) }]"
>
    <div class="title-bar">
        <span
            class="c-c__menu-hamburger"
            :class="{ 'is-enabled': !condition.isDefault }"
            @click="expanded = !condition.expanded"
        ></span>
        <span
            class="is-enabled flex-elem"
            :class="['c-c__disclosure-triangle', { 'c-c__disclosure-triangle--expanded': expanded }]"
            @click="expanded = !condition.expanded"
        ></span>
        <div class="condition-summary">
            <span class="condition-name">{{ condition.definition.name }}</span>
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
         class="condition-config-edit widget-rule-content c-sw-editui__rules-wrapper holder widget-rules-wrapper flex-elem expanded"
    >
        <div id="ruleArea"
             class="c-sw-editui__rules widget-rules"
        >
            <div class="c-sw-rule">
                <div class="c-sw-rule__ui l-compact-form l-widget-rule has-local-controls">
                    <div>
                        <ul class="t-widget-rule-config">
                            <li>
                                <label>Condition Name</label>
                                <span class="controls">
                                    <input v-model="condition.definition.name"
                                           class="t-rule-name-input"
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
                                           class="t-rule-name-input"
                                           type="text"
                                    >
                                </span>
                            </li>
                        </ul>
                        <div v-if="!condition.isDefault"
                             class="widget-rule-content expanded"
                        >
                            <ul class="t-widget-rule-config">
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
                            <ul class="t-widget-rule-config">
                                <li v-if="telemetry.length"
                                    class="has-local-controls t-condition"
                                >
                                    <label>when</label>
                                    <span class="t-configuration">
                                        <span class="controls">
                                            <select v-model="selectedTelemetryKey"
                                                    @change="telemetryChange"
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
                                                    @change="operationKeyChange"
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
                                                   class="t-rule-name-input"
                                                   type="text"
                                                   v-model="operationValue"
                                                   @keyup="getOperationValue"
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
        this.conditionClass.off('conditionResultUpdated', this.handleConditionResult.bind(this));
        if (this.conditionClass && typeof this.conditionClass.destroy === 'function') {
            this.conditionClass.destroy();
        }
    },
    mounted() {
        this.openmct.objects.get(this.conditionIdentifier).then((obj => {
            this.condition = obj;
            this.setOutput();
            this.setOperation();
            this.updateTelemetry();
            this.conditionClass = new ConditionClass(this.condition, this.openmct);
            this.conditionClass.on('conditionResultUpdated', this.handleConditionResult.bind(this));
        }));
    },
    updated() {
        this.persist();
    },
    methods: {
        handleConditionResult(args) {
            this.$emit('condition-result-updated', {
                id: this.conditionIdentifier,
                result: args.data.result
            })
        },
        removeCondition(ev) {
            this.$emit('remove-condition', this.conditionIdentifier);
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
            if (this.condition.definition.criteria.length && this.condition.definition.criteria[0].operation) {
                for (let i=0, ii=this.operations.length; i < ii; i++) {
                    if (this.condition.definition.criteria[0].operation === this.operations[i].name) {
                        this.selectedOperationKey = this.operations[i].name;
                        this.comparisonValueField = this.operations[i].inputCount > 0;
                        if (this.comparisonValueField) {
                            this.operationValue = this.condition.definition.criteria[0].input;
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
                this.condition.definition.criteria[0].key = this.selectedTelemetryKey;
                this.condition.definition.criteria[0].metaDataKey = this.selectedMetaDataKey;
                this.condition.definition.criteria[0].operation = this.selectedOperationKey;
                this.condition.definition.criteria[0].input = this.operationValue || '';
            }
        },
        persist() {
            this.openmct.objects.mutate(this.condition, 'definition', this.condition.definition);
        },
        checkInputValue() {
            if (this.selectedOutputKey === this.outputOptions[2].key) {
                this.condition.definition.output = '';
            } else {
                this.condition.definition.output = this.selectedOutputKey;
            }
        },
        operationKeyChange(ev) {
            if (this.selectedOperationKey !== 'isUndefined' && this.selectedOperationKey !== 'isDefined') {
                this.comparisonValueField = true;
            } else {
                this.comparisonValueField = false;
            }
            this.updateConditionCriteria();
            //find the criterion being updated and set the operation property
        },
        telemetryChange() {
            this.selectedMetaDataKey = '';
            this.updateConditionCriteria();
            this.updateTelemetry();
        },
        getOperationValue(ev) {
            // this.condition.definition.criteria[0].input = [ev.target.value];
            this.updateConditionCriteria();
            //find the criterion being updated and set the input property
        },
        updateCurrentCondition() {
            this.$emit('update-current-condition', this.conditionIdentifier);
        }
    }
}
</script>
