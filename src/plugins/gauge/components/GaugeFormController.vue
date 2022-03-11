/*****************************************************************************
* Open MCT, Copyright (c) 2014-2022, United States Government
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
<span class="form-control shell">
    <span class="field control"
          :class="model.cssClass"
    >
        <div class="form-row c-form__row">
            <ToggleSwitch
                id="isUseTelemetryLimits"
                :checked="isUseTelemetryLimits"
                :label="`Use telemetry limits`"
                @change="toggleUseTelemetryLimits"
            />
        </div>

        <div v-if="!isUseTelemetryLimits">
            <div class="form-row c-form__row">
                <label>Min value</label>
                <input v-model="min"
                       type="number"
                       @input="onChange"
                >

                <label>Max value</label>
                <input v-model="max"
                       type="number"
                       @input="onChange"
                >
            </div>

            <div class="form-row c-form__row">
                <label>Low Limit</label>
                <input v-model="limitLow"
                       type="number"
                       @input="onChange"
                >
            </div>

            <div class="form-row c-form__row">
                <label>High Limit</label>
                <input v-model="limitHigh"
                       type="number"
                       @input="onChange"
                >
            </div>
        </div>
    </span>
</span>
</template>

<script>
import ToggleSwitch from '@/ui/components/ToggleSwitch.vue';
import { GAUGE_TYPES } from '../GaugePlugin';

export default {
    components: {
        ToggleSwitch
    },
    props: {
        model: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            gaugeType: this.model.value.gaugeType || this.getGaugeTypes().value,
            isUseTelemetryLimits: this.model.value.isUseTelemetryLimits,
            isDisplayMinMax: this.model.value.isDisplayMinMax,
            limitHigh: this.model.value.limitHigh,
            limitLow: this.model.value.limitLow,
            max: this.model.value.max,
            min: this.model.value.min,
            precision: this.model.value.precision
        };
    },
    methods: {
        changeGaugeType(data) {
            this.gaugeType = data.value;

            this.onChange();
        },
        getGaugeTypes() {
            const options = GAUGE_TYPES.map(type => {
                return {
                    name: type[0],
                    value: type[1]
                };
            });

            return {
                options,
                value: this.gaugeType || options[0].value
            };
        },
        onChange() {
            const data = {
                model: this.model,
                value: {...this._data}
            };

            this.$emit('onChange', data);
        },
        toggleUseTelemetryLimits() {
            this.isUseTelemetryLimits = !this.isUseTelemetryLimits;

            this.onChange();
        },
        toggleMinMax() {
            this.isDisplayMinMax = !this.isDisplayMinMax;

            this.onChange();
        }
    }
};
</script>
