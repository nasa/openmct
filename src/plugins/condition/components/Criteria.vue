<template>
<li class="has-local-controls t-condition">
    <label>{{ index === 0 ? 'when' : 'and when' }}</label>
    <span class="t-configuration">
        <span class="controls">
            <select v-model="selectedTelemetryObject">
                <option value="">- Select Telemetry -</option>
                <option v-for="telemetryOption in telemetryObj"
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
                <option v-for="option in telemetryMetadata[currentCriteria.identifier]"
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
    inject: ["openmct", "domainObject"],
    props: {
        telemetry: {
            type: Array,
            required: true,
            default: () => []
        }
    },
    data() {
        return {
            telemetryObj: this.telemetry,
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
        this.openmct.objects.get(this.conditionIdentifier).then((domainObject => {
            this.domainObject = domainObject;
            this.initialize();
        }));

    },
    updated() {
        this.validate();
    },
    computed: {

    },
    methods: {
        initialize() {

        },
        setOperationObject(identifier) {
            if (this.selectedFieldObject[identifier] !== undefined) {
                if (this.operationValue[identifier] !== undefined) {
                    for (let i=0, ii=this.operations.length; i < ii; i++) {
                        if (this.currentCriteria.operation === this.operations[i].name) {
                            this.selectedFieldObject[identifier] = this.operations[i].name;

                            this.comparisonInputValue[identifier] = this.operations[i].inputCount > 0;
                            if (this.comparisonInputValue[identifier]) {
                                this.operationValue[identifier] = this.currentCriteria.input[0];
                            }
                        }
                    }
                }
            }
        },
        updateConditionCriteria(identifier) {
            if (this.domainObject.configuration.criteria.length) {
                let criterion = this.domainObject.configuration.criteria[0];
                criterion.key = this.selectedTelemetryKey[identifier];
                criterion.metadataKey = this.selectedMetadataKey[identifier];
                criterion.operation = this.selectedOperationName[identifier];
                criterion.input = this.operationValue;
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
