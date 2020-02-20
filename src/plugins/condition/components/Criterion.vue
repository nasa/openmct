<template>
<div>
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
        <span class="controls">
            <select v-model="criterion.metadata">
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
            <select v-model="criterion.operation"
                    @change="updateOperationInputVisibility"
            >
                <option value="">- Select Comparison -</option>
                <option v-for="option in operations"
                        :key="option.name"
                        :value="option.name"
                >
                    {{ option.text }}
                </option>
            </select>
            <input v-if="isInputOperation"
                   v-model="criterion.input"
                   class="t-condition-name-input"
                   type="text"
                   @blur="persist"
            >
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
        },
        isDefault: {
            type: Boolean,
            default: false
        }
    },
    data() {
        return {
            telemetryMetadata: {},
            operations: OPERATIONS,
            isInputOperation: false,
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
        this.updateOperationInputVisibility();
    },
    methods: {
        updateMetadataOptions() {
            if (this.criterion.telemetry) {
                this.openmct.objects.get(this.criterion.telemetry).then((telemetryObject) => {
                    this.telemetryMetadata = this.openmct.telemetry.getMetadata(telemetryObject).values();
                });
            }
            this.persist();
        },
        updateOperationInputVisibility() {
            for (let i=0; i < this.operations.length; i++) {
                if (this.criterion.operation === this.operations[i].name) {
                    this.isInputOperation = this.operations[i].inputCount > 0;
                    if (!this.isInputOperation) {this.criterion.input = ''}
                }
            }
            this.persist();
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
