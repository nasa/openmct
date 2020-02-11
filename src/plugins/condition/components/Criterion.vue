<template>
<li class="has-local-controls t-condition">
    <label>{{ index === 0 ? 'when' : 'and when' }}</label>
    <span class="t-configuration">
        <span class="controls">
            <select v-model="selectedTelemetryObject">
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
            <select v-model="selectedFieldObject">
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
            <select v-model="selectedOperationObject">
                <option value="">- Select Comparison -</option>
                <option v-for="option in operations"
                        :key="option.name"
                        :value="option.name"
                >
                    {{ option.text }}
                </option>
            </select>
            <input class="t-condition-name-input"
                   type="text"
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
            selectedTelemetryObject: {},
            selectedFieldObject: {},
            selectedOperationObject: {},
            operationValue: {},
            comparisonInputValue: {}
        }
    },
    mounted() {
        console.log('criterion', this.criterion);
        console.log('condition', this.condition);
        this.initialize();

    },
    updated() {
        // this.validate();
    },
    methods: {
        initialize() {
            // 1. need to get values to appear in select menus and determine what should be selected
            this.setTelemetrySelects()

            // 2. for operation menu, show input unless isDefined, isUndefined are selected
            // this.setOperationInput()

        },
        setTelemetrySelects() {
            console.log('this.domainObject', this.domainObject);

            if (this.criterion.telemetryName) {
                this.selectedTelemetryObject.name = this.criterion.telemetryName;
            } else {
                this.telemetryObj[0].name = '- Select Telemetry -';
                this.selectedTelemetryObject.name = '- Select Telemetry -';
            }

            this.openmct.objects.get(this.domainObject.identifier).then((condition) => {
                // this.telemetryMetadata = this.openmct.telemetry.getMetadata(condition).values();
                console.log('condition', condition);
            });

            // this.selectedFieldObject = this.getTelemetryMetadataKey();
            // this.selectedTelemetryObject = this.getTelemetryObject();
            // console.log('this.telemetryMetadata', this.telemetryMetadata)
            // console.log('this.selectedMetadataKey', this.selectedMetadataKey)
            // console.log('this.selectedTelemetryObject', this.selectedTelemetryObject)
        },
        setOperationInput() {
            if (this.selectedFieldObject !== undefined) {
                if (this.operationValue !== undefined) {
                    for (let i=0, ii=this.operations.length; i < ii; i++) {
                        if (this.currentCriteria.operation === this.operations[i].name) {
                            this.selectedFieldObject = this.operations[i].name;

                            this.comparisonInputValue = this.operations[i].inputCount > 0;
                            if (this.comparisonInputValue) {
                                this.operationValue = this.currentCriteria.input[0];
                            }
                        }
                    }
                }
            }
        },
        hasTelemetry(identifier) {
            // TODO: check parent domainObject.composition.hasTelemetry
            return this.currentCriteria && identifier;
        }

        // validate(criteriaId) {
        //     if (this.hasTelemetry(criteriaId) && !this.getTelemetryKey(criteriaId)) {
        //         this.reset();
        //     } else {
        //         if (!this.conditionClass) {
        //             this.initialize();
        //         }
        //     }
        // }
    }
};
</script>
