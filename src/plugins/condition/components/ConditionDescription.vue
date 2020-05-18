/*****************************************************************************
* Open MCT, Copyright (c) 2014-2020, United States Government
* as represented by the Administrator of the National Aeronautics and Space
* Administration. All rights reserved.
*
* Open MCT is licensed under the Apache License, Version 2.0 (the
* "License"); you may not use this file except in compliance with the License.
* You may obtain a copy of the License at
* http://www.apache.org/licenses/LICENSE-2.0.
*
* Unless required by applicable law or agreed to in writing, software
* distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
* WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
* License for the specific language governing permissions and limitations
* under the License.
*
* Open MCT includes source code licensed under additional open source
* licenses. See the Open Source Licenses file (LICENSES.md) included with
* this source code distribution or the Licensing information page available
* at runtime from the About dialog for additional information.
*****************************************************************************/

<template>
<div class="c-style__condition-desc">
    <span v-if="showLabel && condition"
          class="c-style__condition-desc__name c-condition__name"
    >
        {{ condition.configuration.name }}
    </span>
    <span v-for="(criterionDescription, index) in criterionDescriptions"
          :key="criterionDescription"
          class="c-style__condition-desc__text"
    >
        <template v-if="!index">When</template>
        {{ criterionDescription }}
        <template v-if="index < (criterionDescriptions.length-1)">{{ triggerDescription }}</template>
    </span>
</div>
</template>

<script>
import { TRIGGER } from "@/plugins/condition/utils/constants";
import { OPERATIONS } from "@/plugins/condition/utils/operations";

export default {
    name: 'ConditionDescription',
    inject: [
        'openmct'
    ],
    props: {
        showLabel: {
            type: Boolean,
            default: false
        },
        condition: {
            type: Object,
            default() {
                return undefined;
            }
        }
    },
    data() {
        return {
            criterionDescriptions: [],
            triggerDescription: ''
        };
    },
    watch: {
        condition: {
            handler(val) {
                this.getConditionDescription();
            },
            deep: true
        }
    },
    mounted() {
        this.getConditionDescription();
    },
    methods: {
        getTriggerDescription(trigger) {
            let description = '';
            switch(trigger) {
            case TRIGGER.ANY:
            case TRIGGER.XOR:
                description = 'or';
                break;
            case TRIGGER.ALL:
            case TRIGGER.NOT: description = 'and';
                break;
            }
            return description;
        },
        getConditionDescription() {
            if (this.condition) {
                this.triggerDescription =  this.getTriggerDescription(this.condition.configuration.trigger);
                this.criterionDescriptions = [];
                this.condition.configuration.criteria.forEach((criterion, index) => {
                    this.getCriterionDescription(criterion, index);
                });
                if (this.condition.isDefault) {
                    this.criterionDescriptions.splice(0, 0, 'all else fails');
                }
            } else {
                this.criterionDescriptions = [];
            }
        },
        getCriterionDescription(criterion, index) {
            if (!criterion.telemetry) {
                let description = `Unknown ${criterion.metadata} ${this.getOperatorText(criterion.operation, criterion.input)}`;
                this.criterionDescriptions.splice(index, 0, description);
            } else if (criterion.telemetry === 'all' || criterion.telemetry === 'any') {
                const telemetryDescription = criterion.telemetry === 'all' ? 'All telemetry' : 'Any telemetry';
                let description = `${telemetryDescription} ${criterion.metadata} ${this.getOperatorText(criterion.operation, criterion.input)}`;
                this.criterionDescriptions.splice(index, 0, description);
            } else {
                this.openmct.objects.get(criterion.telemetry).then((telemetryObject) => {
                    if (telemetryObject.type === 'unknown') {
                        let description = `Unknown ${criterion.metadata} ${this.getOperatorText(criterion.operation, criterion.input)}`;
                        this.criterionDescriptions.splice(index, 0, description);
                    } else {
                        let metadataValue = criterion.metadata;
                        let inputValue = criterion.input;
                        if (criterion.metadata) {
                            this.telemetryMetadata = this.openmct.telemetry.getMetadata(telemetryObject);

                            const metadataObj = this.telemetryMetadata.valueMetadatas.find((metadata) => metadata.key === criterion.metadata);
                            if (metadataObj) {
                                if (metadataObj.name) {
                                    metadataValue = metadataObj.name;
                                }
                                if(metadataObj.enumerations && inputValue.length) {
                                    if (metadataObj.enumerations[inputValue[0]] && metadataObj.enumerations[inputValue[0]].string) {
                                        inputValue = [metadataObj.enumerations[inputValue[0]].string];
                                    }
                                }
                            }
                        }
                        let description = `${telemetryObject.name} ${metadataValue} ${this.getOperatorText(criterion.operation, inputValue)}`;
                        if (this.criterionDescriptions[index]) {
                            this.criterionDescriptions[index] = description;
                        } else {
                            this.criterionDescriptions.splice(index, 0, description);
                        }
                    }
                });
            }
        },
        getOperatorText(operationName, values) {
            const found = OPERATIONS.find((operation) => operation.name === operationName);
            return found ? found.getDescription(values) : '';
        }
    }
};
</script>
