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
<div
    v-if="selectedTimeSystem.name"
    class="c-ctrl-wrapper c-ctrl-wrapper--menus-up"
>
    <button
        class="c-button--menu c-time-system-button"
        :class="selectedTimeSystem.cssClass"
        @click.prevent="toggle"
    >
        <span class="c-button__label">{{ selectedTimeSystem.name }}</span>
    </button>
    <div
        v-if="open"
        class="c-menu"
    >
        <ul>
            <li
                v-for="timeSystem in timeSystems"
                :key="timeSystem.key"
                :class="timeSystem.cssClass"
                @click="setTimeSystemFromView(timeSystem)"
            >
                {{ timeSystem.name }}
            </li>
        </ul>
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

        return {
            selectedTimeSystem: JSON.parse(JSON.stringify(this.openmct.time.timeSystem())),
            timeSystems: this.getValidTimesystemsForClock(activeClock)
        };
    },
    mounted: function () {
        this.openmct.time.on('timeSystem', this.setViewFromTimeSystem);
        this.openmct.time.on('clock', this.setViewFromClock);
    },
    destroyed: function () {
        this.openmct.time.off('timeSystem', this.setViewFromTimeSystem);
        this.openmct.time.on('clock', this.setViewFromClock);
    },
    methods: {
        getValidTimesystemsForClock(clock) {
            return this.configuration.menuOptions
                .filter(menuOption => menuOption.clock === (clock && clock.key))
                .map(menuOption => JSON.parse(JSON.stringify(this.openmct.time.timeSystems.get(menuOption.timeSystem))));
        },
        setTimeSystemFromView(timeSystem) {
            if (timeSystem.key !== this.selectedTimeSystem.key) {
                let activeClock = this.openmct.time.clock();
                let configuration = this.getMatchingConfig({
                    clock: activeClock && activeClock.key,
                    timeSystem: timeSystem.key
                });
                if (activeClock === undefined) {
                    let bounds;

                    if (this.selectedTimeSystem.isUTCBased && timeSystem.isUTCBased) {
                        bounds = this.openmct.time.bounds();
                    } else {
                        bounds = configuration.bounds;
                    }

                    this.openmct.time.timeSystem(timeSystem.key, bounds);
                } else {
                    this.openmct.time.timeSystem(timeSystem.key);
                    this.openmct.time.clockOffsets(configuration.clockOffsets);
                }
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

        setViewFromTimeSystem(timeSystem) {
            this.selectedTimeSystem = timeSystem;
        },

        setViewFromClock(clock) {
            let activeClock = this.openmct.time.clock();
            this.timeSystems = this.getValidTimesystemsForClock(activeClock);
        }
    }

};
</script>
