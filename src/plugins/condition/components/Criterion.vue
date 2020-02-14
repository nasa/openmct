<template>
<li class="has-local-controls t-condition">
    <label>{{ setRowLabel }}</label>
    <span class="t-configuration">
        <span class="controls">
            <select v-model="selectedTelemetryObject"
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
            <select v-model="selectedMetadataOption"
                    @change="updateMetadataSelection"
            >
                <option value="">- Select Field -</option>
                <option v-for="option in telemetryMetadata"
                        :key="option.key"
                        :value="option"
                >
                    {{ option.name }}
                </option>
            </select>
        </span>
        <span class="controls">
            <select v-model="selectedOperationOption"
                    @change="updateOperationOption"
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
                   v-model="comparisonInputValue"
                   class="t-condition-name-input"
                   type="text"
                   @blur="setInput"
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
            operations: OPERATIONS,
            selectedTelemetryObject: this.criterion.telemetry || '',
            selectedMetadataOption: this.criterion.metadata || {},
            selectedOperationOption: this.criterion.operation || '',
            comparisonInputValue: this.criterion.input || '',
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
        this.initialize();
    },
    methods: {
        initialize() {
            this.updateMetadataOptions();
            this.updateOperationInputVisibility();
        },
        updateMetadataOptions() {
            if (this.selectedTelemetryObject) {
                this.openmct.objects.get(this.selectedTelemetryObject).then((telemetryObject) => {
                    this.telemetryMetadata = this.openmct.telemetry.getMetadata(telemetryObject).values();
                });
                this.criterion.telemetry = this.selectedTelemetryObject;
            } else {
                this.selectedMetadataOption = '';
            }
            this.persist();
        },
        updateOperationOption() {
            this.criterion.operation = this.selectedOperationOption;
            this.updateOperationInputVisibility();
            this.persist();
        },
        updateOperationInputVisibility() {
            for (let i=0; i < this.operations.length; i++) {
                if (this.selectedOperationOption === this.operations[i].name) {
                    if (this.operations[i].inputCount > 0) {
                        this.isInputOperation = true;
                    } else {
                        this.isInputOperation = false;
                        this.comparisonInputValue = '';
                    }
                }
            }
            this.criterion.operation = this.selectedOperationOption;
        },
        updateMetadataSelection() {
            this.comparisonInputValue = '';
            this.criterion.metadata = this.selectedMetadataOption;
            this.persist();
        },
        setInput() {
            this.criterion.input = this.comparisonInputValue;
            this.persist();
        },
        persist() {
            this.$emit('persist', this.criterion);
        }
    }
};
</script>
