<template>
<div v-if="condition"
     :data-condition-index="conditionIndex"
     class="c-c-editui__conditions c-c-container__container c-c__drag-wrapper"
     :class="['widget-condition', { 'widget-condition--current': currentConditionIdentifier && (currentConditionIdentifier.key === conditionIdentifier.key) }]"
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
                            <ul class="t-widget-condition-config">
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
                                                   class="t-condition-name-input"
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
        },
        currentConditionIdentifier: {
            type: Object,
            required: true
        },
        conditionIndex: {
            type: Number,
            required: true
        }
    },
    data() {
        return {
            condition: this.condition,
            expanded: true,
            telemetryObject: this.telemetryObject,
            telemetryMetadata: this.telemetryMetadata,
            operations: OPERATIONS,
            selectedMetaDataKey: null,
            selectedTelemetryKey: '',
            selectedOperationKey: '',
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

        this.dragGhost = document.getElementById('js-c-drag-ghost');
    },
    updated() {
        if (this.isCurrent && this.isCurrent.key === this.condition.key) {
            this.updateCurrentCondition();
        }
        this.persist();
    },
    methods: {
        dragStart(e) {
            this.$emit('set-move-index', Number(e.target.getAttribute('data-condition-index')));
        },
        handleConditionResult(args) {
            // console.log('ConditionEdit::Result', args);
            this.$emit('condition-result-updated', {
                id: this.conditionIdentifier,
                result: args.data.result
            })
        },
        removeCondition(ev) { //move this to conditionCollection
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
                    }
                }
            }
        },
        updateTelemetry() {
            if (this.hasTelemetry()) {
                this.openmct.objects.get(this.condition.definition.criteria[0].key).then((obj) => {
                    this.telemetryObject = obj;
                    this.telemetryMetadata = this.openmct.telemetry.getMetadata(this.telemetryObject).values();
                    // this.selectedMetaDataKey = this.telemetryMetadata[0].key;
                    this.selectedMetaDataKey = '';
                    this.selectedTelemetryKey = this.telemetryObject.identifier;
                });
            } else {
                this.telemetryObject = null;
            }
        },
        hasTelemetry() {
            return this.condition.definition.criteria.length && this.condition.definition.criteria[0].key;
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
            if (ev.target.value !== 'isUndefined' && ev.target.value !== 'isDefined') {
                this.comparisonValueField = true;
            } else {
                this.comparisonValueField = false;
            }
            this.condition.definition.criteria[0].operation = this.selectedOperationKey;
            this.persist();
            //find the criterion being updated and set the operation property
        },
        getOperationValue(ev) {
            this.condition.definition.criteria[0].input = [ev.target.value];
            this.persist();
            //find the criterion being updated and set the input property
        },
        updateCurrentCondition() {
            this.$emit('update-current-condition', this.conditionIdentifier);
        }
    }
}
</script>
