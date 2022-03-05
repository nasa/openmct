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
            <label>Bi directional Gauge</label>
            <input type="checkbox"
                   :checked="isBiDirectional"
                   @input="toggleBiDirectional"
            >
        </div>
        <div class="form-row c-form__row">
            <label>Display Min/Max</label>
            <input type="checkbox"
                   :checked="isDisplayMinMax"
                   @input="toggleMinMax"
            >
        </div>

        <div class="form-row c-form__row">
            <label>Value Precision</label>
            <input v-model="precision"
                   type="number"
                   @input="onChange"
            >
        </div>

        <div v-if="isBiDirectional">
            <div class="form-row c-form__row">
                <label>Min Limit</label>
                <input v-model="min"
                       type="number"
                       @input="onChange"
                >

                <label>Max Limit</label>
                <input v-model="max"
                       type="number"
                       @input="onChange"
                >
            </div>
            <span>Note: min/max value ll be calculated automatically</span>
        </div>
        <div v-else>
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
                <label>Max Limit</label>
                <input v-model="limit"
                       type="number"
                       @input="onChange"
                >
            </div>
        </div>
    </span>
</span>
</template>

<script>
export default {
    props: {
        model: {
            type: Object,
            required: true
        }
    },
    data() {
        return {
            isBiDirectional: this.model.value.isBiDirectional,
            isDisplayMinMax: this.model.value.isDisplayMinMax,
            limit: this.model.value.limit,
            max: this.model.value.max,
            min: this.model.value.min,
            precision: this.model.value.precision
        };
    },
    methods: {
        onChange() {
            const data = {
                model: this.model,
                value: {...this._data}
            };

            this.$emit('onChange', data);
        },
        toggleBiDirectional() {
            this.isBiDirectional = !this.isBiDirectional;

            this.onChange();
        },
        toggleMinMax() {
            this.isDisplayMinMax = !this.isDisplayMinMax;

            this.onChange();
        }
    }
};
</script>
