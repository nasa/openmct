<template>
<div class="u-contents">
    <div class="c-cdef__separator c-row-separator"></div>
    <span class="c-cdef__label">{{ setRowLabel }}</span>
    <span class="c-cdef__controls">
        <span class="c-cdef__control">
            <select v-model="criterion.telemetry"
                    @change="updateMetadataOptions"
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
        <span v-if="criterion.telemetry"
              class="c-cdef__control"
        >
            <select v-model="criterion.metadata"
                    @change="updateOperations"
            >
                <option value="">- Select Field -</option>
                <option v-for="option in telemetryMetadataOptions"
                        :key="option.key"
                        :value="option.key"
                >
                    {{ option.name }}
                </option>
            </select>
        </span>
        <span v-if="criterion.telemetry && criterion.metadata"
              class="c-cdef__control"
        >
            <select v-model="criterion.operation"
                    @change="updateOperationInputVisibility"
            >
                <option value="">- Select Comparison -</option>
                <option v-for="option in filteredOps"
                        :key="option.name"
                        :value="option.name"
                >
                    {{ option.text }}
                </option>
            </select>
            <span v-for="(item, inputIndex) in inputCount"
                  :key="inputIndex"
                  class="c-cdef__control__inputs"
            >
                <input v-model="criterion.input[inputIndex]"
                       class="c-cdef__control__input"
                       :type="setInputType"
                       @blur="persist"
                >
                <span v-if="inputIndex < inputCount-1">and</span>
            </span>
        </span>
    </span>
</div>
</template>

<script>
import { OPERATIONS } from '../utils/operations';

export default {
    inject: ['openmct'],
    props: {
        criterion: {
            type: Object,
            required: true
        },
        telemetry: {
            type: Array,
            required: true,
            default: () => []
        },
        index: {
            type: Number,
            required: true
        },
        trigger: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            telemetryMetadata: {},
            telemetryMetadataOptions: {},
            operations: OPERATIONS,
            inputCount: 0,
            rowLabel: '',
            operationFormat: ''
        }
    },
    computed: {
        setRowLabel: function () {
            let operator = this.trigger === 'all' ? 'and ': 'or ';
            return (this.index !== 0 ? operator : '') + 'when';
        },
        filteredOps: function () {
            return [...this.operations.filter(op => op.appliesTo.indexOf(this.operationFormat) !== -1)];
        },
        setInputType: function () {
            let type = '';
            for (let i = 0; i < this.filteredOps.length; i++) {
                if (this.criterion.operation === this.filteredOps[i].name) {
                    if (this.filteredOps[i].appliesTo.length === 1) {
                        type = this.filteredOps[i].appliesTo[0];
                    } else {
                        type = 'string'
                    }
                }
            }
            return type;
        }
    },
    mounted() {
        this.updateMetadataOptions();
    },
    methods: {
        getOperationFormat() {
            this.telemetryMetadata.valueMetadatas.forEach((value, index) => {
                if (value.key === this.criterion.metadata) {
                    let valueMetadata = this.telemetryMetadataOptions[index];
                    if (valueMetadata.enumerations !== undefined) {
                        this.operationFormat = 'enum';
                    } else if (valueMetadata.hints.hasOwnProperty('range')) {
                        this.operationFormat = 'number';
                    } else if (valueMetadata.hints.hasOwnProperty('domain')) {
                        this.operationFormat = 'number';
                    } else if (valueMetadata.key === 'name') {
                        this.operationFormat = 'string';
                    } else {
                        this.operationFormat = 'string';
                    }
                }
            });
        },
        updateMetadataOptions(ev) {
            if (ev) {this.clearInputs()}
            if (this.criterion.telemetry) {
                this.openmct.objects.get(this.criterion.telemetry).then((telemetryObject) => {
                    this.criterion.telemetry.name = telemetryObject.name;
                    this.telemetryMetadata = this.openmct.telemetry.getMetadata(telemetryObject);
                    this.telemetryMetadataOptions = this.telemetryMetadata.values();
                    this.updateOperations();
                    this.updateOperationInputVisibility();
                });
            } else {
                this.criterion.metadata = '';
            }
        },
        updateOperations(ev) {
            if (ev) {this.clearInputs()}
            this.getOperationFormat();
            this.persist();
        },
        updateOperationInputVisibility(ev) {
            if (ev) {
                this.criterion.input = [];
                this.inputCount = 0;
            }
            for (let i = 0; i < this.filteredOps.length; i++) {
                if (this.criterion.operation === this.filteredOps[i].name) {
                    this.inputCount = this.filteredOps[i].inputCount;
                    if (!this.inputCount) {this.criterion.input = []}
                }
            }
            this.persist();
        },
        clearInputs() {
            this.criterion.operation = '';
            this.criterion.input = [];
            this.inputCount = 0;
        },
        updateMetadataSelection() {
            this.updateOperationInputVisibility();
        },
        persist() {
            this.$emit('persist', this.criterion);
        }
    }
};
</script>
