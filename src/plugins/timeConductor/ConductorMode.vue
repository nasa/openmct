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
    <button
        class="c-button--menu c-mode-button"
        @click.prevent="toggle"
    >
        <span class="c-button__label">{{ selectedMode.name }}</span>
    </button>
    <div
        v-if="open"
        class="c-menu c-super-menu c-conductor__mode-menu"
    >
        <div class="c-super-menu__menu">
            <ul>
                <li
                    v-for="mode in modes"
                    :key="mode.key"
                    class="menu-item-a"
                    :class="mode.cssClass"
                    @click="setOption(mode)"
                    @mouseover="hoveredMode = mode"
                    @mouseleave="hoveredMode = {}"
                >
                    {{ mode.name }}
                </li>
            </ul>
        </div>
        <div class="c-super-menu__item-description">
            <div :class="['l-item-description__icon', 'bg-' + hoveredMode.cssClass]"></div>
            <div class="l-item-description__name">
                {{ hoveredMode.name }}
            </div>
            <div class="l-item-description__description">
                {{ hoveredMode.description }}
            </div>
        </div>
    </div>
</div>
</template>

<script>
import toggleMixin from '../../ui/mixins/toggle-mixin';

export default {
    inject: ['openmct', 'configuration'],
    mixins: [toggleMixin],
    data: function () {
        let activeClock = this.openmct.time.clock();
        if (activeClock !== undefined) {
            //Create copy of active clock so the time API does not get reactified.
            activeClock = Object.create(activeClock);
        }

        return {
            selectedMode: this.getModeOptionForClock(activeClock),
            selectedTimeSystem: JSON.parse(JSON.stringify(this.openmct.time.timeSystem())),
            modes: [],
            hoveredMode: {}
        };
    },
    mounted: function () {
        this.loadClocksFromConfiguration();

        this.openmct.time.on('clock', this.setViewFromClock);
    },
    destroyed: function () {
        this.openmct.time.off('clock', this.setViewFromClock);
    },
    methods: {
        loadClocksFromConfiguration() {
            let clocks = this.configuration.menuOptions
                .map(menuOption => menuOption.clock)
                .filter(isDefinedAndUnique)
                .map(this.getClock);

            /*
             * Populate the modes menu with metadata from the available clocks
             * "Fixed Mode" is always first, and has no defined clock
             */
            this.modes = [undefined]
                .concat(clocks)
                .map(this.getModeOptionForClock);

            function isDefinedAndUnique(key, index, array) {
                return key !== undefined && array.indexOf(key) === index;
            }
        },

        getModeOptionForClock(clock) {
            if (clock === undefined) {
                return {
                    key: 'fixed',
                    name: 'Fixed Timespan',
                    description: 'Query and explore data that falls between two fixed datetimes.',
                    cssClass: 'icon-tabular'
                };
            } else {
                return {
                    key: clock.key,
                    name: clock.name,
                    description: "Monitor streaming data in real-time. The Time "
                    + "Conductor and displays will automatically advance themselves based on this clock. " + clock.description,
                    cssClass: clock.cssClass || 'icon-clock'
                };
            }
        },

        getClock(key) {
            return this.openmct.time.getAllClocks().filter(function (clock) {
                return clock.key === key;
            })[0];
        },

        setOption(option) {
            let clockKey = option.key;
            if (clockKey === 'fixed') {
                clockKey = undefined;
            }

            let configuration = this.getMatchingConfig({
                clock: clockKey,
                timeSystem: this.openmct.time.timeSystem().key
            });

            if (configuration === undefined) {
                configuration = this.getMatchingConfig({
                    clock: clockKey
                });

                this.openmct.time.timeSystem(configuration.timeSystem, configuration.bounds);
            }

            if (clockKey === undefined) {
                this.openmct.time.stopClock();
            } else {
                this.openmct.time.clock(clockKey, configuration.clockOffsets);
            }
        },

        getMatchingConfig(options) {
            const matchers = {
                clock(config) {
                    return options.clock === config.clock;
                },
                timeSystem(config) {
                    return options.timeSystem === config.timeSystem;
                }
            };

            function configMatches(config) {
                return Object.keys(options).reduce((match, option) => {
                    return match && matchers[option](config);
                }, true);
            }

            return this.configuration.menuOptions.filter(configMatches)[0];
        },

        setViewFromClock(clock) {
            this.selectedMode = this.getModeOptionForClock(clock);
        }
    }

};
</script>
