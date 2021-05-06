<!--
 Open MCT, Copyright (c) 2014-2021, United States Government
 as represented by the Administrator of the National Aeronautics and Space
 Administration. All rights reserved.

 Open MCT is licensed under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0.

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 License for the specific language governing permissions and limitations
 under the License.

 Open MCT includes source code licensed under additional open source
 licenses. See the Open Source Licenses file (LICENSES.md) included with
 this source code distribution or the Licensing information page available
 at runtime from the About dialog for additional information.
-->
<template>
<div class="c-inspector__properties c-inspect-properties">
    <template v-if="false">
        <!-- If only one Activity is selected -->
        <div class="c-inspect-properties__header">
            Time
        </div>
        <ul class="c-inspect-properties__section">
            <li class="c-inspect-properties__row">
                <div class="c-inspect-properties__label">
                    Start Datetime
                </div>
                <div class="c-inspect-properties__value">
                    2023-12-15 07:19:34.995Z
                </div>
            </li>
            <li class="c-inspect-properties__row">
                <div class="c-inspect-properties__label">
                    End Datetime
                </div>
                <div class="c-inspect-properties__value">
                    2023-12-15 08:19:34.995Z
                </div>
            </li>
            <li class="c-inspect-properties__row">
                <div class="c-inspect-properties__label">
                    Duration
                </div>
                <div class="c-inspect-properties__value">
                    01:00:00
                </div>
            </li>
        </ul>
    </template>

    <template v-if="true">
        <!-- If two or more Activities are selected -->
        <div class="c-inspect-properties__header">
            Convex Hull
        </div>
        <ul class="c-inspect-properties__section">
            <li class="c-inspect-properties__row">
                <div class="c-inspect-properties__label">
                    Earliest Start
                </div>
                <div class="c-inspect-properties__value">
                    2023-12-15 08:19:34.995Z
                </div>
            </li>
            <li class="c-inspect-properties__row">
                <div class="c-inspect-properties__label">
                    Latest End
                </div>
                <div class="c-inspect-properties__value">
                    2023-12-15 08:19:34.995Z
                </div>
            </li>
            <li class="c-inspect-properties__row">
                <div class="c-inspect-properties__label">
                    {{ (true) ? 'Gap' : 'Overlap' }}
                </div>
                <div class="c-inspect-properties__value">
                    00:04:30
                </div>
            </li>
            <li class="c-inspect-properties__row">
                <div class="c-inspect-properties__label">
                    Total Time
                </div>
                <div class="c-inspect-properties__value">
                    02:04:30
                </div>
            </li>
        </ul>
    </template>

    <template v-if="true">
        <!-- If one or more properties exist for selected activities -->
        <div class="c-inspect-properties__header">
            Properties
        </div>
        <ul class="c-inspect-properties__section">
            <li class="c-inspect-properties__row"
                v-for="n  in 10" :key="n"
            >
                <div class="c-inspect-properties__label">
                    Property {{n}} Name
                </div>
                <div class="c-inspect-properties__value">
                    Property Value
                </div>
            </li>
        </ul>
    </template>

    <template v-if="true">
        <!-- If one or more links exist for selected activities -->
        <div class="c-inspect-properties__header">
            Links
        </div>
        <ul class="c-inspect-properties__section">
            <li class="c-inspect-properties__row"
                v-for="n  in 3" :key="n"
            >
                <div class="c-inspect-properties__value --span-all">
                    Link {{n}}
                </div>
            </li>
        </ul>
    </template>
</div>
</template>

<script>
export default {
    inject: ['openmct', 'domainObject'],
    data() {
        return {
            name: this.domainObject.name
        };
    },
    mounted() {
        this.openmct.editor.on('isEditing', this.setEditState);
    },
    beforeDestroy() {
        this.openmct.editor.off('isEditing', this.setEditState);
    },
    methods: {
        setEditState(isEditing) {
            this.isEditing = isEditing;
        }
    }
};
</script>
