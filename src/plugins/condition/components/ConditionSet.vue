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
        <section id="current-output">
            <div class="c-cs__ui__header">
                <span class="c-cs__ui__header-label">Current Output</span>
            </div>
            <div class="c-cs__ui_content">
                <span v-if="currentConditionOutput"
                      class="current-output"
                >
                    {{ currentConditionOutput }}
                </span>
                <span v-else>No output selected</span>
            </div>
        </section>
        <TestData :is-editing="isEditing" />
        <ConditionCollection :is-editing="isEditing" />
    </div>
</div>
</template>

<script>
import TestData from './TestData.vue';
import ConditionCollection from './ConditionCollection.vue';

export default {
    inject: ["openmct", "domainObject"],
    components: {
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
            this.currentConditionOutput = currentConditionResult.output;
        },
        provideTelemetry() {
            this.openmct.telemetry
                .request(this.domainObject)
                .then(output => {
                    this.updateCurrentOutput(output[0]);
                });
            this.stopProvidingTelemetry = this.openmct.telemetry
                .subscribe(this.domainObject, output => { this.updateCurrentOutput(output); });
        }
    }
};
</script>

