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
    <div class="s-menu-button menu-element"
        :class="selectedTimeSystem.cssClass">

        <span class="l-click-area" @click="toggleMenu($event)"></span>
        <span class="title-label" v-if="selectedTimeSystem.name">
            {{selectedTimeSystem.name}}
        </span>

        <div class="menu" v-if="showMenu">
            <ul>
                <li @click="setTimeSystemFromView(timeSystem)"
                    v-for="timeSystem in timeSystems"
                    :key="timeSystem.key"
                    :class="timeSystem.cssClass">
                        {{timeSystem.name}}
                </li>
            </ul>
        </div>
    </div>
</div>
</template>

<style lang="scss">
</style>

<script>
export default {
    inject: ['openmct', 'configuration'],
    data: function () {
        let activeClock = this.openmct.time.clock();

        return {
            selectedTimeSystem: JSON.parse(JSON.stringify(this.openmct.time.timeSystem())),
            timeSystems: this.getValidTimesystemsForClock(activeClock),
            showMenu: false
        };
    },
    methods: {
        getValidTimesystemsForClock(clock) {
            return this.configuration.menuOptions
                .filter(menuOption => menuOption.clock === (clock && clock.key))
                .map(menuOption => JSON.parse(JSON.stringify(this.openmct.time.timeSystems.get(menuOption.timeSystem))));
        },

        setTimeSystemFromView(timeSystem) {
            if (timeSystem !== this.selectedTimeSystem) {
                let activeClock = this.openmct.time.clock();
                let configuration = this.getMatchingConfig({
                    clock: activeClock && activeClock.key, 
                    timeSystem: timeSystem.key
                });
                if (activeClock === undefined) {
                    this.openmct.time.timeSystem(timeSystem.key, configuration.bounds);
                } else {
                    this.openmct.time.timeSystem(timeSystem.key);
                    this.openmct.time.clockOffsets(configuration.clockOffsets);
                }
            }
        },

        getMatchingConfig(options) {
            const matchers = {
                clock(config) {
                    return options.clock === config.clock
                },
                timeSystem(config) {
                    return options.timeSystem === config.timeSystem
                }
            };

            function configMatches(config) {
                return Object.keys(options).reduce((match, option) => {
                    return match && matchers[option](config);
                }, true);
            }

            return this.configuration.menuOptions.filter(configMatches)[0];
        },

        toggleMenu(event) {
            this.showMenu = !this.showMenu;

            if (this.showMenu) {
                document.addEventListener('click', this.toggleMenu, true);
            } else {
                document.removeEventListener('click', this.toggleMenu, true);
            }
        },

        setViewFromTimeSystem(timeSystem) {
            this.selectedTimeSystem = timeSystem;
        },

        setViewFromClock(clock) {
            let activeClock = this.openmct.time.clock();
            this.timeSystems = this.getValidTimesystemsForClock(activeClock);
        }
    },
    mounted: function () {
        this.openmct.time.on('timeSystem', this.setViewFromTimeSystem);
        this.openmct.time.on('clock', this.setViewFromClock);
    },
    destroyed: function () {
        this.openmct.time.off('timeSystem', this.setViewFromTimeSystem);
        this.openmct.time.on('clock', this.setViewFromClock);
    }

}
</script>
