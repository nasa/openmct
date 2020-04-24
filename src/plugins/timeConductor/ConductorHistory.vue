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
         class="c-menu c-conductor__history-menu"
    >
        <ul
            v-if="hasHistoryPresets"
        >
            <li
                v-for="preset in presets"
                :key="preset.label"
                class="icon-clock"
                @click="selectTimespan(preset.bounds)"
            >
                {{ preset.label }}
            </li>
        </ul>

        <div class="c-menu__section-separator c-menu__section-hint">
            Past timeframes, ordered by latest first
        </div>

        <ul>
            <li
                v-for="(timespan, index) in historyForCurrentTimeSystem"
                :key="index"
                class="icon-history"
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

const LOCAL_STORAGE_HISTORY_KEY = 'tcHistory';
const DEFAULT_RECORDS = 10;
const DEFAULT_UTC_PRESETS = [
    {
        label: 'Last Day',
        bounds: {
            start: Date.now() - 1000 * 60 * 60 * 24,
            end: Date.now()
        }
    },
    {
        label: 'Last 2 hours',
        bounds: {
            start: Date.now() - 1000 * 60 * 60 * 2,
            end: Date.now()
        }
    },
    {
        label: 'Last hour',
        bounds: {
            start: Date.now() - 1000 * 60 * 60,
            end: Date.now()
        }
    }
];

export default {
    inject: ['openmct', 'configuration'],
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
            history: {}, // contains arrays of timespans {start, end}, array key is time system key
            presets: []
        }
    },
    computed: {
        hasHistoryPresets() {
            return this.timeSystem.isUTCBased && this.presets.length;
        },
        historyForCurrentTimeSystem() {
            const history = this.history[this.timeSystem.key];

            return history;
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
                this.loadConfiguration();
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
            // const isNotEqual = (entry) => entry.start !== this.start || entry.end !== this.end;
            const isNotEqual = function (entry) {
                const start = entry.start !== this.start;
                const end = entry.end !== this.end;

                return start || end;
            };
            currentHistory = currentHistory.filter(isNotEqual, timespan);

            while (currentHistory.length >= this.records) {
                currentHistory.pop();
            }

            currentHistory.unshift(timespan);
            this.history[key] = currentHistory;
        },
        selectTimespan(timespan) {
            this.openmct.time.bounds(timespan);
        },
        selectHours(hours) {
            const now = Date.now();
            this.selectTimespan({
                start: now - hours * 60 * 60 * 1000,
                end: now
            });
        },
        loadConfiguration() {
            const configurations = this.configuration.menuOptions
                .filter(option => option.timeSystem ===  this.timeSystem.key);

            this.presets = this.loadPresets(configurations);
            this.records = this.loadRecords(configurations);
        },
        loadPresets(configurations) {
            const configuration = configurations.find(option => option.presets);
            const preset = configuration ? configuration.presets : DEFAULT_UTC_PRESETS;

            return preset;
        },
        loadRecords(configurations) {
            const configuration = configurations.find(option => option.records);
            const records = configuration ? configuration.records : DEFAULT_RECORDS;

            return records;
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
