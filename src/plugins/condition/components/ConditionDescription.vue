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
    <span v-if="showLabel"
          class="c-style__condition-desc__name c-condition__name"
    >
        {{ condition.configuration.name }}
    </span>
    <span v-for="(criterionDescription, index) in criterionDescriptions"
          :key="criterionDescription.description"
          class="c-style__condition-desc__text"
    >
        <template v-if="!index">When</template>
        {{ criterionDescription.description }}
        <template v-if="index < (criterionDescriptions.length-1)">{{ triggerDescription }}</template>
    </span>
</div>
</template>

<script>
import {TRIGGER} from "@/plugins/condition/utils/constants";
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
        }
    },
    mounted() {
        this.getConditionDescription();
    },
    methods: {
        getConditionDescription() {
            if (this.condition) {
                this.triggerDescription = this.condition.configuration.trigger === TRIGGER.ANY ? ' or ' : ' and ';
                this.criterionDescriptions = [];
                this.condition.configuration.criteria.forEach((criterion, index) => {
                    this.getCriterionDescription(criterion, index);
                });
                if (this.condition.isDefault) {
                    this.criterionDescriptions.splice(0, 0, {
                        description: 'all else fails'
                    });
                }
            } else if (this.conditionStyle.conditionId !== 'default') {
                //couldn't find the condition. That's bad!
                this.conditionErrors = [{
                    message: this.ERROR.CONDITION_NOT_FOUND,
                    additionalInfo: `Condition Id: ${this.conditionStyle.conditionId}`
                }];
            }
        },
        getCriterionDescription(criterion, index) {
            if(criterion.telemetry) {
                this.openmct.objects.get(criterion.telemetry).then((telemetryObject) => {
                    let description = `${telemetryObject.name} ${criterion.metadata} ${this.getOperatorText(criterion.operation, criterion.input)}`;
                    this.criterionDescriptions.splice(index, 0, {
                        description
                    });
                });
            } else {
                let description = `Unknown ${criterion.metadata} ${this.getOperatorText(criterion.operation, criterion.input)}`;
                this.criterionDescriptions.splice(index, 0, {
                    description
                });
                this.conditionErrors.push({
                    message: this.ERROR.TELEMETRY_NOT_FOUND,
                    additionalInfo: `Key: ${this.openmct.objects.makeKeyString(criterion.telemetry)}`
                });
            }
        },
        getOperatorText(operationName, values) {
            const found = OPERATIONS.find((operation) => operation.name === operationName);
            return found ? found.getDescription(values) : '';
        }
    }
}
</script>
