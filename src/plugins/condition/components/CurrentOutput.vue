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
<section id="current-output"
         class="l-cs__current-output"
>
    <div class="l-cs__section-header">
        <div class="l-cs__section-title">Current Output</div>
    </div>
    <div class="l-cs__current-output-value">
        {{ condition.definition.output }}
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
    },
    updated() {

    },
    methods: {

    }
}
</script>
