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
                    v-for="(tick, index) in historyForCurrentTimeSystem"
                    :key="index"
                >
                    {{tick.start}} - {{tick.end}} {{formattedTimeSystem}}
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

const LOCAL_STORAGE_HISTORY_MAX_RECORDS = 3
const LOCAL_STORAGE_HISTORY_KEY = 'tcHistory'

export default {
    inject: ['openmct'],
    mixins: [toggleMixin],
    props: {
        bounds: {
            type: Object,
            required: true
        },
        timeSystem: {
            type: Object,
            required: true
        },
        isFixed: Boolean,
        isUTCBased: Boolean
    },
    data() {
        return {
            history: {}
        }
    },
    computed: {
        historyForCurrentTimeSystem() {
            return this.history[this.timeSystem.key]
        }
    },
    methods: {
        addTick() {
            const tick = {
                start: this.bounds.start,
                end: this.bounds.end,
            };

            const key = this.timeSystem.key;
            const [...currentHistory] = this.history[key] || []
            if (currentHistory.length >= LOCAL_STORAGE_HISTORY_MAX_RECORDS) {
                currentHistory.shift();
            }
            currentHistory.push(tick)
            console.log(key)
            console.log(currentHistory)
            this.history[key] = currentHistory
            
        },
        clear() {

        }
    },
    watch: {
        bounds: {
            handler() {
                console.log('adding tick from bounds change')
                this.addTick();
            },
            deep: true
        },
        timeSystem: {
            handler() {
                console.log('adding tick from time system change')
                console.log(this.timeSystem)
                this.addTick();
            },
            deep: true
        },
        history: {
            handler() {
                console.log(`persisting history ${this.history.local.length} ${this.history.utc.length}`);
                localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(this.history));
            },
            deep: true
        }
    },
    created() {
    },
    mounted() {
        console.log("mounted")
        // this.history is an object containing arrays of time system history keyed by the time system key
        if (localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY)) {
            this.history = JSON.parse(localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY))
        } else {
            this.history = {};
            localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(this.history));
        }
    },
    destroyed() {
    }

}
</script>
