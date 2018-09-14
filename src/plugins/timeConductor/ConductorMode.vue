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
<div class="holder flex-elem menus-up time-system">
    <span>
        <div class="s-menu-button" @click="toggleMenu($event)">
            <span class="title-label">{{selectedClock.name}}</span>
        </div>
        <div class="menu super-menu mini l-mode-selector-menu"
            v-if="showMenu">
            <div class="w-menu">
                <div class="col menu-items">
                    <ul>
                        <li v-for="option in clocks"
                            :key="option.key"
                            @click="setOption(option)">
                            <a @mouseover="hoveredClock = option"
                            @mouseleave="hoveredClock = {}"
                            class="menu-item-a"
                            :class="option.cssClass">
                                {{option.name}}
                            </a>
                        </li>
                    </ul>
                </div>
                <div class="col menu-item-description">
                    <div class="desc-area ui-symbol icon type-icon" :class="hoveredClock.cssClass"></div>
                    <div class="w-title-desc">
                        <div class="desc-area title">
                            {{hoveredClock.name}}
                        </div>
                        <div class="desc-area description">
                            {{hoveredClock.description}}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </span>
</div>
</template>

<style lang="scss">
</style>

<script>
export default {
    inject: ['openmct', 'configuration'],
    data: function () {
        let activeClock = Object.create(this.openmct.time.clock());
        return {
            selectedClock: activeClock,
            selectedTimeSystem: Object.create(this.openmct.time.timeSystem()),
            clocks: [],
            hoveredClock: {},
            showMenu: false
        };
    },
    methods: {
        loadClocksFromConfiguration() {
            /*
             * "Fixed Mode" is always the first available option.
             */
            this.clocks = [{
                key: 'fixed',
                name: 'Fixed Timespan Mode',
                description: 'Query and explore data that falls between two fixed datetimes.',
                cssClass: 'icon-calendar'
            }];
            let clocks = {};

            this.configuration.menuOptions.forEach(menuOption => {
                let clockKey = menuOption.clock || 'fixed';
                let clock = this.getClock(clockKey);

                if (clock !== undefined) {
                    clocks[clock.key] = clock;
                }
            });

            /*
             * Populate the clocks menu with metadata from the available clocks
             */
            Object.values(clocks).forEach(clock => {
                this.clocks.push({
                    key: clock.key,
                    name: clock.name,
                    description: "Monitor streaming data in real-time. The Time " +
                    "Conductor and displays will automatically advance themselves based on this clock. " + clock.description,
                    cssClass: clock.cssClass || 'icon-clock',
                    clock: clock
                });
            });
        },

        getValidTimesystemsForClock(clock) {
            return this.configuration.menuOptions
                .filter(menuOption => menuOption.clock === clock.key)
                .map(menuOption => Object.create(this.openmct.time.timeSystems.get(menuOption.timeSystem)));
        },

        getClock(key) {
            return this.openmct.time.getAllClocks().filter(function (clock) {
                return clock.key === key;
            })[0];
        },

        setOption(option) {
            this.selectedClock = option;
            let configuration = this.getConfigForClockAndTimeSystem(this.openmct.time.clock(), this.openmct.time.timeSystem());
            if (configuration === undefined) {
                configuration = this.getDefaultConfigClock(option.clock);
                this.openmct.time.timeSystem(timeSystem);
                configuration = this.getConfigForClockAndTimeSystem(this.openmct.time.clock(), this.openmct.time.timeSystem());
            }
            this.openmct.time.clock(option.clock);
        },

        getConfigForClockAndTimeSystem(clock, timeSystem) {
            return this.configuration.menuOptions.filter(menuOption => {
                return menuOption.clock === clock.key && 
                    menuOption.timeSystem === timeSystem.key;
            })
        },

        toggleMenu(event) {
            this.showMenu = !this.showMenu;

            if (this.showMenu) {
                document.addEventListener('click', this.toggleMenu);
                event.stopPropagation();
            } else {
                document.removeEventListener('click', this.toggleMenu);
            }
        },
    },
    mounted: function () {
        this.loadClocksFromConfiguration();
    },
    destroyed: function () {
    }

}
</script>
