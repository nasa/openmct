<template>
<li class="has-local-controls t-condition">
    <label>{{ setRowLabel }}</label>
    <span class="t-configuration">
        <span class="controls">
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
              class="controls"
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
              class="controls"
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
            <input v-if="inputCount > 0"
                   v-model="criterion.input[0]"
                   class="t-condition-name-input"
                   type="text"
                   @blur="persist"
            >
            <span v-if="inputCount === 2">and</span>
            <input v-if="inputCount === 2"
                   v-model="criterion.input[1]"
                   class="t-condition-name-input"
                   type="text"
                   @blur="persist"
            >
        </span>
    </span>
</li>
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
            filteredOps: [],
            inputCount: 0,
            rowLabel: ''
        }
    },
    computed: {
        setRowLabel: function () {
            let operator = this.trigger === 'all' ? 'and ': 'or ';
            return (this.index !== 0 ? operator : '') + 'when';
        }
    },
    mounted() {
        this.updateMetadataOptions();
    },
    methods: {
        updateMetadataOptions(ev) {
            if (ev) {this.clearInputs()}
            if (this.criterion.telemetry) {
                this.openmct.objects.get(this.criterion.telemetry).then((telemetryObject) => {
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
            let operationFormat = 'string';
            this.telemetryMetadata.valueMetadatas.forEach((value, index) => {
                if (value.key === this.criterion.metadata) {
                    let valueMetadata = this.telemetryMetadataOptions[index];
                    if (valueMetadata.formatString) {
                        operationFormat = 'number';
                    } else if (valueMetadata.format) {
                        if (valueMetadata.format === 'utc') {
                            operationFormat = 'number';
                        } else if (valueMetadata.format === 'enum') {
                            operationFormat = 'enum';
                        }
                    }
                }
            });
            this.filteredOps = [...this.operations.filter(op => op.appliesTo.indexOf(operationFormat) !== -1)];
            this.persist();
        },
        updateOperationInputVisibility(ev) {
            if (ev) {
                this.criterion.input = [];
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
