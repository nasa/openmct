<template>
<div v-if="condition"
     class="c-cs-editui__conditions"
     :class="['widget-condition', { 'widget-condition--current': condition.isCurrent }]"
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
            <span class="condition-description">{{ condition.definition.description }}</span>
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
                                <li v-if="telemetryObject && telemetryMetadata"
                                    class="has-local-controls t-condition"
                                >
                                    <label>when</label>
                                    <span class="t-configuration">
                                        <span class="controls">
                                            <select v-model="selectedTelemetryKey"
                                                    class=""
                                            >
                                                <option value="">- Select Telemetry -</option>
                                                <option :value="telemetryObject.identifier">{{ telemetryObject.name }}</option>
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
                                            <select @change="getOperationKey">
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
        }
    },
    data() {
        return {
            condition: this.condition,
            expanded: true,
            conditionCollection: this.conditionCollection,
            telemetryObject: this.telemetryObject,
            telemetryMetadata: this.telemetryMetadata,
            operations: OPERATIONS,
            selectedMetaDataKey: null,
            selectedTelemetryKey: null,
            selectedOperationKey: null,
            selectedOutputKey: null,
            stringOutputField: false,
            comparisonValueField: false,
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
        if (this.conditionClass && typeof this.conditionClass.destroy === 'function') {
            this.conditionClass.destroy();
        }
    },
    mounted() {
        this.openmct.objects.get(this.conditionIdentifier).then((obj => {
            this.condition = obj;
            this.conditionClass = new ConditionClass(this.condition, this.openmct);
            this.conditionClass.on('conditionResultUpdated', this.handleConditionResult.bind(this))
            this.setOutput();
            this.updateTelemetry();
        }));
    },
    updated() {
        this.persist();
    },
    methods: {
        handleConditionResult(args) {
            console.log('ConditionEdit::Result', args);
            this.$emit('condition-result-updated', {
                id: this.conditionIdentifier,
                result: args.data.result
            })
        },
        removeCondition(ev) { //move this to conditionCollection
            // const conditionDiv = ev.target.closest('.conditionArea');
            // const conditionCollectionDiv = conditionDiv.closest('.condition-collection');
            // const index = Array.from(conditionCollectionDiv.children).indexOf(conditionDiv);
            //
            // this.domainObject.configuration.conditionCollection.splice(index, 1);
        },
        setOutput() {
            if (this.condition.definition.output !== 'false' && this.condition.definition.output !== 'true') {
                // this.$refs.outputSelect.value = 'string';
                this.selectedOutputKey = this.outputOptions[2].key;
                // this.stringOutputField = true;
            } else {
                if (this.condition.definition.output === 'true') {
                    this.selectedOutputKey = this.outputOptions[1].key;
                } else {
                    this.selectedOutputKey = this.outputOptions[0].key;
                }
            }
        },
        updateTelemetry() {
            if (this.hasTelemetry()) {
                this.openmct.objects.get(this.condition.definition.criteria[0].key).then((obj) => {
                    this.telemetryObject = obj;
                    this.telemetryMetadata = this.openmct.telemetry.getMetadata(this.telemetryObject).values();
                    this.selectedMetaDataKey = this.telemetryMetadata[0].key;
                    this.selectedTelemetryKey = this.telemetryObject.identifier;
                });
            } else {
                this.telemetryObject = null;
            }
        },
        hasTelemetry() {
            return this.condition.definition.criteria.length && this.condition.definition.criteria[0].key;
        },
        persist(index) { //this should only persist the condition domain object
            this.openmct.objects.mutate(this.condition, 'definition', this.condition.definition);
        },
        checkInputValue() {
            if (this.selectedOutputKey === this.outputOptions[2].key) {
                this.condition.definition.output = '';
            }
        },
        getOperationKey(ev) {
            if (ev.target.value !== 'isUndefined' && ev.target.value !== 'isDefined') {
                this.comparisonValueField = true;
            } else {
                this.comparisonValueField = false;
            }
            this.selectedOperationKey = ev.target.value;
            this.condition.definition.operator = this.selectedOperationKey;
            this.persist();
            //find the criterion being updated and set the operator property
        },
        getOperationValue(ev) {
            this.selectedOperationKey = ev.target.value;
            //find the criterion being updated and set the input property
        }
    }
}
</script>
