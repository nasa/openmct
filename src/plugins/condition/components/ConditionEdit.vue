<template>
<div class="c-cs-editui__conditions"
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
            <span class="condition-name">{{ condition.name }}</span>
            <span class="condition-description">{{ condition.description }}</span>
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
                                    <input v-model="condition.name"
                                           class="t-rule-name-input"
                                           type="text"
                                    >
                                </span>
                            </li>
                            <li>
                                <label>Output</label>
                                <span class="controls">
                                    <select ref="outputSelect"
                                            @change="getOutputBinary">
                                        <option value="false">False</option>
                                        <option value="true">True</option>
                                        <option value="string">String</option>
                                    </select>
                                    <input v-if="stringOutputField"
                                           ref="outputString"
                                           class="t-rule-name-input"
                                           type="text"
                                           :value="condition.output"
                                           @keyup="getOutputString"
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
                                            <select class="">
                                                <option value="">- Select Telemetry -</option>
                                                <option :value="telemetryObject.key">{{ telemetryObject.name }}</option>
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
export default {
    inject: ['openmct', 'domainObject'],
    props: {
        condition: {
            type: Object,
            required: true
        }
    },
    data() {
        let conditionCollection = this.domainObject.configuration.conditionCollection;
        return {
            expanded: true,
            name: this.condition.name,
            description: this.condition.description,
            conditionCollection,
            telemetryObject: this.telemetryObject,
            telemetryMetadata: this.telemetryMetadata,
            operations: OPERATIONS,
            selectedMetaDataKey: null,
            selectedOperationKey: null,
            stringOutputField: false,
            comparisonValueField: false
        };
    },
    mounted() {
        if (this.condition.output !== 'false' && this.condition.output !== 'true') {
            this.$refs.outputSelect.value = 'string';
            this.stringOutputField = true;
        }
        this.updateTelemetry();
    },
    updated() {
        this.updateCurrentCondition();
        this.persist();
    },
    methods: {
        removeCondition(ev) {
            const conditionDiv = ev.target.closest('.conditionArea');
            const conditionCollectionDiv = conditionDiv.closest('.condition-collection');
            const index = Array.from(conditionCollectionDiv.children).indexOf(conditionDiv);

            this.domainObject.configuration.conditionCollection.splice(index, 1);
        },
        updateTelemetry() {
            if (this.hasTelemetry()) {
                this.openmct.objects.get(this.condition.criteria[0].key).then((obj) => {
                    this.telemetryObject = obj;
                    this.telemetryMetadata = this.openmct.telemetry.getMetadata(this.telemetryObject).values();
                    this.selectedMetaDataKey = this.telemetryMetadata[0].key;
                    console.log('ConditionEdit', this.telemetryObject, this.telemetryMetadata);
                });
            } else {
                this.telemetryObject = null;
            }
        },
        hasTelemetry() {
            return this.condition.criteria.length && this.condition.criteria[0].key;
        },
        persist(index) {
            if (index) {
                this.openmct.objects.mutate(this.domainObject, `configuration.conditionCollection[${index}]`, this.domainObject.configuration.conditionCollection[index]);
            } else {
                this.openmct.objects.mutate(this.domainObject, 'configuration.conditionCollection', this.domainObject.configuration.conditionCollection);
            }
        },
        updateCurrentCondition() {
            // TODO: replace based on telemetry
            if (this.conditionCollection.length > 1) {
                this.conditionCollection.forEach((condition, index) => {
                    index === 0 ? condition.isCurrent = true : condition.isCurrent = false
                });
            } else {
                this.conditionCollection[0].isCurrent = true;
            }
        },
        getOutputBinary(ev) {
            if (ev.target.value !== 'string') {
                this.condition.output = ev.target.value;
                this.stringOutputField = false;
            } else {
                this.stringOutputField = true;
            }
        },
        getOutputString(ev) {
            this.condition.output = ev.target.value;
        },
        getOperationKey(ev) {
            console.log(ev.target.value)
            if (ev.target.value !== 'isUndefined' && ev.target.value !== 'isDefined') {
                this.comparisonValueField = true;
            } else {
                this.comparisonValueField = false;
            }
            this.selectedOperationKey = ev.target.value;
        },
        getOperationValue(ev) {
            this.selectedOperationKey = ev.target.value;
        }
    }
}
</script>
