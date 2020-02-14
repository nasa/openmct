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
<section id="current-output">
    <div v-if="condition"
         class="c-cs__ui__header"
    >
        <span class="c-cs__ui__header-label">Current Output</span>
        <span
            class="is-enabled flex-elem"
            :class="['c-cs__disclosure-triangle', { 'c-cs__disclosure-triangle--expanded': expanded }]"
            @click="expanded = !expanded"
        ></span>
    </div>
    <div v-if="expanded && condition"
         class="c-cs__ui_content"
    >
        <div>
            <span class="current-output">{{ condition.configuration.output }}</span>
        </div>
    </div>
</section>
</template>

<script>
export default {
    inject: ['openmct', 'domainObject'],
    props: {
        isEditing: Boolean,
        condition: {
            default: () => {return null;},
            type: Object
        }
    },
    data() {
        return {
            expanded: true
        }
    },
    mounted() {
        // console.log('this.condition', this.condition);
    },
    updated() {

    },
    methods: {

    }
}
</script>
