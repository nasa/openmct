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
            @click.prevent="toggle"
    >
        <span class="c-button__label">History</span>
    </button>
    <div v-if="open"
         class="c-menu"
    >
        <ul
            v-if="isUTCBased"
        >
            <li @click="selectHours(24)">Last 24 hours</li>
            <li @click="selectHours(2)">Last 2 hours</li>
            <li @click="selectHours(1)">Last hour</li>
        </ul>
        <ul>
            <li
                v-for="(timespan, index) in historyForCurrentTimeSystem"
                :key="index"
                @click="selectTimespan(timespan)"
            >
                {{ formatTime(timespan.start) }} - {{ formatTime(timespan.end) }}
            </li>
        </ul>
    </div>
</div>
</template>

<script>
import toggleMixin from '../../ui/mixins/toggle-mixin';
import _ from 'lodash'

const LOCAL_STORAGE_HISTORY_MAX_RECORDS = 20;
const LOCAL_STORAGE_HISTORY_KEY = 'tcHistory';

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
        }
    },
    data() {
        return {
            history: {} // contains arrays of timespans {start, end}, array key is time system key
        }
    },
    computed: {
        isUTCBased() {
            return this.timeSystem.isUTCBased;
        },
        historyForCurrentTimeSystem() {
            return this.history[this.timeSystem.key]
        }
    },
    watch: {
        bounds: {
            handler() {
                this.addTimespan();
            },
            deep: true
        },
        timeSystem: {
            handler() {
                this.addTimespan();
            },
            deep: true
        },
        history: {
            handler() {
                this.persistHistoryToLocalStorage();
            },
            deep: true
        }
    },
    mounted() {
        this.getHistoryFromLocalStorage();
    },
    methods: {
        getHistoryFromLocalStorage() {
            if (localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY)) {
                this.history = JSON.parse(localStorage.getItem(LOCAL_STORAGE_HISTORY_KEY))
            } else {
                this.history = {};
                this.persistHistoryToLocalStorage();
            }
        },
        persistHistoryToLocalStorage() {
            localStorage.setItem(LOCAL_STORAGE_HISTORY_KEY, JSON.stringify(this.history));
        },
        addTimespan() {
            const key = this.timeSystem.key;
            let [...currentHistory] = this.history[key] || [];
            const timespan = {
                start: this.bounds.start,
                end: this.bounds.end
            };

            // when choosing an existing entry, remove it and add it back as latest entry
            currentHistory = currentHistory.filter((entry) => {
                return !_.isEqual(timespan, entry);
            });

            if (currentHistory.length >= LOCAL_STORAGE_HISTORY_MAX_RECORDS) {
                currentHistory.shift();
            }

            currentHistory.push(timespan);
            this.history[key] = currentHistory;
        },
        selectTimespan(timespan) {
            this.$emit('select-timespan', timespan);
        },
        selectHours(hours) {
            const now = Date.now();
            this.selectTimespan({
                start: now - hours * 60 * 60 * 1000,
                end: now
            });
        },
        formatTime(time) {
            const formatter = this.openmct.telemetry.getValueFormatter({
                format: this.timeSystem.timeFormat
            }).formatter;

            return formatter.format(time);
        }
    }
}
</script>
