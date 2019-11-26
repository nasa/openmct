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
                    @click="selectTick(tick)"
                >
                    {{ displayTime(tick.start) }} - {{ displayTime(tick.end) }}
                </li>
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
import _ from 'lodash'

const LOCAL_STORAGE_HISTORY_MAX_RECORDS = 5
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
        isUTCBased: Boolean
    },
    data() {
        return {
            history: {} // contains arrays of history keyed by the time system key
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
            let [...currentHistory] = this.history[key] || [];

            // when choosing an existing entry, remove it and add it back as latest entry
            currentHistory = currentHistory.filter((entry) => {
                if (_.isEqual(tick, entry)) {
                }
                return !_.isEqual(tick, entry);
            });

            if (currentHistory.length >= LOCAL_STORAGE_HISTORY_MAX_RECORDS) {
                currentHistory.shift();
            }
            currentHistory.push(tick);

            this.history[key] = currentHistory;
        },
        selectTick(tick) {
            this.$emit('selectTick', tick);
        },
        displayTime(time) {
            const formatter = this.openmct.telemetry.getValueFormatter({
                format: this.timeSystem.timeFormat
            }).formatter;

            return formatter.format(time);
        },
        clear(key) {
            delete this.history[key];
        }
    },
    watch: {
        bounds: {
            handler() {
                this.addTick();
            },
            deep: true
        },
        timeSystem: {
            handler() {
                this.addTick();
            },
            deep: true
        },
        history: {
            handler() {
                localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(this.history));
            },
            deep: true
        }
    },
    created() {
    },
    mounted() {
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
