/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2018, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT Web is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT Web includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/
<template>
    <div class="c-ctrl-wrapper c-ctrl-wrapper--menus-up">
        <button class="c-button--menu c-history-button icon-history"
             @click.prevent="toggle">
            <span class="c-button__label">History</span>
        </button>
        <div class="c-menu" v-if="open">
            <ul
                v-if="isUTCBased"
            >
                <li>Today</li>
                <li>Yesterday</li>
                <li>Last 24 hours</li>
            </ul>
            <ul>
                <li
                    v-for="(tick, index) in history"
                    :key="index"
                >
                    {{tick.start}} {{tick.end}}
                </li>
                <!-- <li @click="setTimeSystemFromView(timeSystem)"
                    v-for="timeSystem in timeSystems"
                    :key="timeSystem.key"
                    :class="timeSystem.cssClass">
                    {{timeSystem.name}}
                </li> -->
            </ul>
        </div>    
    </div>
</template>

<style lang="scss">
    @import "~styles/sass-base";
</style>

<script>
import toggleMixin from '../../ui/mixins/toggle-mixin';
import utcMultiTimeFormat from './utcMultiTimeFormat.js';

export default {
    inject: ['openmct'],
    mixins: [toggleMixin],
    props: {
        bounds: {
            type: Object,
            required: true
        },
        isFixed: Boolean,
        isUTCBased: Boolean
    },
    data() {
        return {
            history: []
        }
    },
    methods: {
        getHistory() {
            const now = (new Date()).getTime()
            console.log(now)
            this.history.push(
                {start: now - 50000, end: now - 15000},
                {start: now - 10000, end: now - 5000}
            )
        },
    },
    watch: {
        bounds: {
            handler: function(bounds) {
                console.log('new bounds from conductor')
            },
            deep: true
        }
    },
    created() {
    },
    mounted() {
        this.getHistory()
    },
    destroyed() {
    }

}
</script>
