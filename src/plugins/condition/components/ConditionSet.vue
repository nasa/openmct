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
<div class="c-cs-edit w-condition-set">
    <div class="c-sw-edit__ui holder">
        <CurrentOutput :output="currentConditionOutput" />
        <TestData :is-editing="isEditing" />
        <ConditionCollection :is-editing="isEditing"
                             @currentConditionSetOutputUpdated="updateCurrentOutput"
        />
    </div>
</div>
</template>

<script>
import CurrentOutput from './CurrentOutput.vue';
import TestData from './TestData.vue';
import ConditionCollection from './ConditionCollection.vue';

export default {
    inject: ["openmct", "domainObject"],
    components: {
        CurrentOutput,
        TestData,
        ConditionCollection
    },
    props: {
        isEditing: Boolean
    },
    data() {
        return {
            currentConditionOutput: ''
        }
    },
    mounted() {
        this.conditionSetIdentifier = this.openmct.objects.makeKeyString(this.domainObject.identifier);
        this.provideTelemetry();
    },
    beforeDestroy() {
        if (this.stopProvidingTelemetry) {
            this.stopProvidingTelemetry();
        }
    },
    methods: {
        updateCurrentOutput(currentConditionResult) {
            if (this.openmct.objects.makeKeyString(currentConditionResult.id) === this.conditionSetIdentifier) {
                this.currentConditionOutput = currentConditionResult.output;
            }
        },
        provideTelemetry() {
            this.stopProvidingTelemetry = this.openmct.telemetry.subscribe(this.domainObject);
        }
    }
};
</script>

