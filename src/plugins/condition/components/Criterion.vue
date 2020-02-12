<template>
<li class="has-local-controls t-condition">
    <label>{{ index === 0 ? 'when' : 'and when' }}</label>
    <span class="t-configuration">
        <span class="controls">
            <select v-model="selectedTelemetryObject"
                    @change="updateFieldOptions"
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
            <select v-model="selectedFieldOption"
                    @change="persist"
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
                    @change="updateOperationInput"
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
                   @change="persist"
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
        condition: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            telemetryMetadata: {},
            operations: OPERATIONS,
            selectedTelemetryObject: '',
            selectedFieldOption: {},
            selectedOperationOption: '',
            operationValue: '',
            comparisonInputValue: '',
            isInputOperation: false
        }
    },
    mounted() {
        this.initialize();
    },
    methods: {
        initialize() {
            this.selectedTelemetryObject = this.criterion.telemetry;
            this.selectedFieldOption = this.criterion.metadata;
            this.selectedOperationOption = this.criterion.operation;
            this.comparisonInputValue = this.criterion.input;
            this.updateOperationInput();
            this.updateFieldOptions();

        },
        updateFieldOptions() {
            if (this.selectedTelemetryObject) {
                this.openmct.objects.get(this.selectedTelemetryObject).then((telemetryObject) => {
                    this.telemetryMetadata = this.openmct.telemetry.getMetadata(telemetryObject).values();
                });
            }
            this.persist();
        },
        updateOperationInput() {
            if (this.selectedOperationOption &&
                (this.selectedOperationOption !== 'isUndefined' &&
                 this.selectedOperationOption !== 'isDefined')) {
                this.isInputOperation = true;
            } else {
                this.isInputOperation = false;
                this.comparisonInputValue = '';
            }
            this.persist();
        },
        persist() {
            this.criterion.telemetry = this.selectedTelemetryObject;
            this.criterion.metadata = this.selectedFieldOption;
            this.criterion.operation = this.selectedOperationOption;
            this.criterion.input = this.comparisonInputValue;
            this.$emit('persist', this.criterion);
        }
    }
};
</script>
