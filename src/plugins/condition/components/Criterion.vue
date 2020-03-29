<template>
<div class="u-contents">
    <div class="c-cdef__separator c-row-separator"></div>
    <span class="c-cdef__label">{{ setRowLabel }}</span>
    <span class="c-cdef__controls">
        <span class="c-cdef__control">
            <select ref="telemetrySelect"
                    v-model="criterion.telemetry"
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
            <select ref="metadataSelect"
                    v-model="criterion.metadata"
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
            <template v-if="!enumerations.length">
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
            </template>
            <span v-else>
                <span v-if="inputCount && criterion.operation"
                      class="c-cdef__control"
                >
                    <select v-model="criterion.input[0]"
                            @change="persist"
                    >
                        <option v-for="option in enumerations"
                                :key="option.string"
                                :value="option.value.toString()"
                        >
                            {{ option.string }}
                        </option>
                    </select>
                </span>
            </span>
        </span>
    </span>
</div>
</template>

<script>
import { OPERATIONS } from '../utils/operations';
import { INPUT_TYPES } from '../utils/operations';

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
            operationFormat: '',
            enumerations: [],
            inputTypes: INPUT_TYPES
        }
    },
    watch: {
        telemetry: {
            handler(newTelemetry, oldTelemetry) {
                this.checkTelemetry();
            },
            deep: true
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
                        type = this.inputTypes[this.filteredOps[i].appliesTo[0]];
                    } else {
                        type = 'text'
                    }
                    break;
                }
            }
            return type;
        }
    },
    mounted() {
        this.updateMetadataOptions();
    },
    methods: {
        checkTelemetry() {
            if(this.criterion.telemetry &&
                !this.telemetry.find((telemetryObj) => this.openmct.objects.areIdsEqual(this.criterion.telemetry, telemetryObj.identifier))) {
                //telemetry being used was removed. So reset this criterion.
                this.criterion.telemetry = '';
                this.criterion.metadata = '';
                this.criterion.input = [];
                this.criterion.operation = '';
                this.persist();
            }
        },
        getOperationFormat() {
            this.enumerations = [];
            this.telemetryMetadata.valueMetadatas.forEach((value, index) => {
                if (value.key === this.criterion.metadata) {
                    let valueMetadata = this.telemetryMetadataOptions[index];
                    if (valueMetadata.enumerations !== undefined) {
                        this.operationFormat = 'enum';
                        this.enumerations = valueMetadata.enumerations;
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
            if (ev) {
                this.clearDependentFields(ev.target)
            }
            if (this.criterion.telemetry) {
                this.openmct.objects.get(this.criterion.telemetry).then((telemetryObject) => {
                    this.telemetryMetadata = this.openmct.telemetry.getMetadata(telemetryObject);
                    this.telemetryMetadataOptions = this.telemetryMetadata.values();
                    this.updateOperations(ev);
                    this.updateOperationInputVisibility();
                });
            } else {
                this.criterion.metadata = '';
            }
        },
        updateOperations(ev) {
            if (ev) {
                this.clearDependentFields(ev.target);
                this.persist();
            }
            this.getOperationFormat();
        },
        updateOperationInputVisibility(ev) {
            if (ev) {
                this.criterion.input = this.enumerations.length ? [this.enumerations[0].value.toString()] : [];
                this.inputCount = 0;
                this.persist();
            }
            for (let i = 0; i < this.filteredOps.length; i++) {
                if (this.criterion.operation === this.filteredOps[i].name) {
                    this.inputCount = this.filteredOps[i].inputCount;
                    if (!this.inputCount) {this.criterion.input = []}
                }
            }
        },
        clearDependentFields(el) {
            if (el === this.$refs.telemetrySelect) {
                this.criterion.metadata = '';
                this.criterion.operation = '';
            } else if (el === this.$refs.metadataSelect) {
                this.criterion.operation = '';
            }
            this.criterion.input = [];
            this.inputCount = 0;
        },
        persist() {
            this.$emit('persist', this.criterion);
        }
    }
};
</script>
