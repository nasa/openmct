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
<section v-show="isEditing"
         id="test-data"
         class="l-cs__test-data"
>
    <div class="l-cs__section-header">
        <div class="l-cs__section-title">Test Data</div>
        <span
                class="is-enabled c-disclosure-triangle"
                :class="{ 'c-disclosure-triangle--expanded': expanded }"
                @click="expanded = !expanded"
        ></span>
    </div>
    <div v-if="expanded"
         class="c-cs__ui_content"
    >
        <label class="checkbox custom">
            <input type="checkbox"
                   class="t-test-data-checkbox"
            >
            <span>Apply Test Data</span>
        </label>
        <div class="t-test-data-config">
            <div class="c-cs-editui__conditions widget-condition">
                <form>
                    <label>
                        <span>Set</span>
                        <select>
                            <option>- Select Input -</option>
                        </select>
                    </label>
                    <span class="is-enabled  flex-elem c-cs__duplicate"></span>
                    <span class="is-enabled  flex-elem c-cs__trash"></span>
                </form>
            </div>
            <div class="c-cs-editui__conditions widget-condition">
                <form>
                    <label>
                        <span>Set</span>
                        <select>
                            <option>- Select Input -</option>
                        </select>
                    </label>
                    <span class="is-enabled c-cs__duplicate"></span>
                    <span class="is-enabled c-cs__trash"></span>
                </form>
            </div>
        </div>
    </div>
</section>
</template>

<script>
export default {
    inject: ['openmct'],
    props: {
        isEditing: Boolean
    },
    data() {
        return {
            expanded: true
        };
    },
    methods: {

    }
}
</script>
