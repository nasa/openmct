/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2020, United States Government
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
        <ul v-if="hasHistoryPresets">
            <li
                v-for="preset in presets"
                :key="preset.label"
                class="icon-clock"
                @click="selectPresetBounds(preset.bounds)"
            >
                {{ preset.label }}
            </li>
        </ul>

        <div
            v-if="hasHistoryPresets"
            class="c-menu__section-separator"
        ></div>

        <div class="c-menu__section-hint">
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

const DEFAULT_DURATION_FORMATTER = 'duration';
const LOCAL_STORAGE_HISTORY_KEY_FIXED = 'tcHistory';
const LOCAL_STORAGE_HISTORY_KEY_REALTIME = 'tcHistoryRealtime';
const DEFAULT_RECORDS = 10;

export default {
    inject: ['openmct', 'configuration'],
    mixins: [toggleMixin],
    props: {
        bounds: {
            type: Object,
            required: true
        },
        offsets: {
            type: Object,
            required: false,
            default: () => {}
        },
        timeSystem: {
            type: Object,
            required: true
        },
        mode: {
            type: String,
            required: true
        }
    },
    data() {
        return {
            /**
             * previous bounds entries available for easy re-use
             * @realtimeHistory array of timespans
             * @timespans {start, end} number representing timestamp
             */
            realtimeHistory: {},
            /**
             * previous bounds entries available for easy re-use
             * @fixedHistory array of timespans
             * @timespans {start, end} number representing timestamp
             */
            fixedHistory: {},
            presets: []
        };
    },
    computed: {
        currentHistory() {
            return this.mode + 'History';
        },
        isFixed() {
            return this.openmct.time.clock() === undefined;
        },
        hasHistoryPresets() {
            return this.timeSystem.isUTCBased && this.presets.length;
        },
        historyForCurrentTimeSystem() {
            const history = this[this.currentHistory][this.timeSystem.key];

            return history;
        },
        storageKey() {
            let key = LOCAL_STORAGE_HISTORY_KEY_FIXED;
            if (this.mode !== 'fixed') {
                key = LOCAL_STORAGE_HISTORY_KEY_REALTIME;
            }

            return key;
        }
    },
    watch: {
        bounds: {
            handler() {
                // only for fixed time since we track offsets for realtime
                if (this.isFixed) {
                    this.addTimespan();
                }
            },
            deep: true
        },
        offsets: {
            handler() {
                this.addTimespan();
            },
            deep: true
        },
        timeSystem: {
            handler(ts) {
                this.loadConfiguration();
                this.addTimespan();
            },
            deep: true
        },
        mode: function () {
            this.getHistoryFromLocalStorage();
            this.initializeHistoryIfNoHistory();
            this.loadConfiguration();
        }
    },
    mounted() {
        this.getHistoryFromLocalStorage();
        this.initializeHistoryIfNoHistory();
    },
    methods: {
        getHistoryFromLocalStorage() {
            const localStorageHistory = localStorage.getItem(this.storageKey);
            const history = localStorageHistory ? JSON.parse(localStorageHistory) : undefined;
            this[this.currentHistory] = history;
        },
        initializeHistoryIfNoHistory() {
            if (!this[this.currentHistory]) {
                this[this.currentHistory] = {};
                this.persistHistoryToLocalStorage();
            }
        },
        persistHistoryToLocalStorage() {
            localStorage.setItem(this.storageKey, JSON.stringify(this[this.currentHistory]));
        },
        addTimespan() {
            const key = this.timeSystem.key;
            let [...currentHistory] = this[this.currentHistory][key] || [];
            const timespan = {
                start: this.isFixed ? this.bounds.start : this.offsets.start,
                end: this.isFixed ? this.bounds.end : this.offsets.end
            };
            let self = this;

            function isNotEqual(entry) {
                const start = entry.start !== self.start;
                const end = entry.end !== self.end;

                return start || end;
            }

            currentHistory = currentHistory.filter(isNotEqual, timespan);

            while (currentHistory.length >= this.records) {
                currentHistory.pop();
            }

            currentHistory.unshift(timespan);
            this.$set(this[this.currentHistory], key, currentHistory);

            this.persistHistoryToLocalStorage();
        },
        selectTimespan(timespan) {
            if (this.isFixed) {
                this.openmct.time.bounds(timespan);
            } else {
                this.openmct.time.clockOffsets(timespan);
            }
        },
        selectPresetBounds(bounds) {
            const start = typeof bounds.start === 'function' ? bounds.start() : bounds.start;
            const end = typeof bounds.end === 'function' ? bounds.end() : bounds.end;

            this.selectTimespan({
                start,
                end
            });
        },
        loadConfiguration() {
            const configurations = this.configuration.menuOptions
                .filter(option => option.timeSystem === this.timeSystem.key);

            this.presets = this.loadPresets(configurations);
            this.records = this.loadRecords(configurations);
        },
        loadPresets(configurations) {
            const configuration = configurations.find(option => {
                return option.presets && option.name.toLowerCase() === this.mode;
            });
            const presets = configuration ? configuration.presets : [];

            return presets;
        },
        loadRecords(configurations) {
            const configuration = configurations.find(option => option.records);
            const records = configuration ? configuration.records : DEFAULT_RECORDS;

            return records;
        },
        formatTime(time) {
            let format = this.timeSystem.timeFormat;
            let isNegativeOffset = false;

            if (!this.isFixed) {
                if (time < 0) {
                    isNegativeOffset = true;
                }

                time = Math.abs(time);

                format = this.timeSystem.durationFormat || DEFAULT_DURATION_FORMATTER;
            }

            const formatter = this.openmct.telemetry.getValueFormatter({
                format: format
            }).formatter;

            return (isNegativeOffset ? '-' : '') + formatter.format(time);
        }
    }
};
</script>
