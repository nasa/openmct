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
                                    <Criterion v-for="(criterion, index) in domainObject.configuration.criteria"
                                               :key="index"
                                               :telemetry="telemetry"
                                               :criterion="criterion"
                                               :condition="domainObject"
                                               :index="index"
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
import uuid from 'uuid';

export default {
    inject: ['openmct', 'domainObject'],
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
            trigger: 'any',
            selectedOutputKey: '',
            stringOutputField: {},
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
        this.persist();
    },
    methods: {
        initialize() {
            if (!this.domainObject.isDefault) {
                this.setOutput();
                this.conditionClass = new ConditionClass(this.domainObject, this.openmct);
                this.conditionClass.on('conditionResultUpdated', this.handleConditionResult.bind(this));
            }
        },
        addCriteria() {
            const criteriaObject = {
                telemetry: '',
                operation: '',
                input: '',
                metadata: '',
                key: {
                    namespace: '',
                    key: uuid()
                }
            }
            this.domainObject.configuration.criteria.push(criteriaObject);
        },
        dragStart(e) {
            this.$emit('set-move-index', Number(e.target.getAttribute('data-condition-index')));
        },
        destroy() {
            // this.conditionClass.off('conditionResultUpdated', this.handleConditionResult.bind(this));
            if (this.conditionClass && typeof this.conditionClass.destroy === 'function') {
                this.conditionClass.destroy();
                delete this.conditionClass;
            }
        },
        reset() {
            this.selectedMetadataKey = {};
            this.selectedTelemetryKey = {};
            this.selectedOperationKey = {};
            this.operationValue = {};
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
        persist() {
            this.openmct.objects.mutate(this.domainObject, 'configuration', this.domainObject.configuration);
        },
        checkInputValue() {
            if (this.selectedOutputKey === this.outputOptions[2].key) {
                this.domainObject.configuration.output = '';
            } else {
                this.domainObject.configuration.output = this.selectedOutputKey;
            }
        },
        updateOutputOption(ev) {
            if (this.selectedOutputKey === this.outputOptions[2].key) {
                this.domainObject.configuration.output = '';
            } else {
                this.domainObject.configuration.output = this.selectedOutputKey;
            }
        },
        updateCurrentCondition() {
            this.$emit('updateCurrentCondition', this.conditionIdentifier);
        },
        hasTelemetry(identifier) {
            // TODO: check parent domainObject.composition.hasTelemetry
            return this.currentCriteria && identifier;
        }
    }
}
</script>


