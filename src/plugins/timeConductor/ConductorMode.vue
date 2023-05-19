<!--
 Open MCT, Copyright (c) 2014-2023, United States Government
 as represented by the Administrator of the National Aeronautics and Space
 Administration. All rights reserved.

 Open MCT is licensed under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0.

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 License for the specific language governing permissions and limitations
 under the License.

 Open MCT includes source code licensed under additional open source
 licenses. See the Open Source Licenses file (LICENSES.md) included with
 this source code distribution or the Licensing information page available
 at runtime from the About dialog for additional information.
-->
<template>
<div>
    <div
        ref="modeButton"
        class="c-tc-input-popup__options"
    >
        <div class="c-menu-button c-ctrl-wrapper c-ctrl-wrapper--menus-left">
            <button
                class="c-button--menu c-button--compact js-mode-button"
                :class="[
                    buttonCssClass,
                    selectedMode.cssClass
                ]"
                @click.prevent.stop="showModesMenu"
            >
                <span class="c-button__label">{{ selectedMode.name }}</span>
            </button>
        </div>
    </div>
    <div
        v-if="clocks.length > 0"
        ref="clockButton"
        class="c-tc-input-popup__options"
    >
        <div class="c-menu-button c-ctrl-wrapper c-ctrl-wrapper--menus-left">
            <button
                class="c-button--menu c-button--compact js-clock-button"
                :class="[
                    buttonCssClass,
                    selectedClock.cssClass
                ]"
                @click.prevent.stop="showClocksMenu"
            >
                <span class="c-button__label">{{ selectedClock.name }}</span>
            </button>
        </div>
    </div>
</div>
</template>

<script>
import toggleMixin from '../../ui/mixins/toggle-mixin';
import modeMixin from './mode-mixin';
import { TIME_CONTEXT_EVENTS, REALTIME_MODE_KEY, FIXED_MODE_KEY } from '../../api/time/constants';

const TEST_IDS = true;

export default {
    mixins: [toggleMixin, modeMixin],
    inject: ['openmct', 'configuration'],
    data: function () {
        const activeClock = this.getActiveClock();
        const mode = this.openmct.time.getMode();

        return {
            selectedMode: this.getModeMetadata(mode, TEST_IDS),
            selectedClock: activeClock ? this.getClockMetadata(activeClock) : undefined,
            selectedTimeSystem: JSON.parse(JSON.stringify(this.openmct.time.timeSystem())),
            modes: [],
            clocks: []
        };
    },
    mounted: function () {
        console.log('conductor mode mounted');
        this.loadModesAndClocks(this.configuration.menuOptions);

        this.followTimeConductor();
    },
    methods: {
        showModesMenu() {
            const elementBoundingClientRect = this.$refs.modeButton.getBoundingClientRect();
            const x = elementBoundingClientRect.x;
            const y = elementBoundingClientRect.y;

            const menuOptions = {
                menuClass: 'c-conductor__mode-menu',
                placement: this.openmct.menus.menuPlacement.TOP_RIGHT
            };

            this.openmct.menus.showSuperMenu(x, y, this.modes, menuOptions);
        },
        showClocksMenu() {
            const elementBoundingClientRect = this.$refs.clockButton.getBoundingClientRect();
            const x = elementBoundingClientRect.x;
            const y = elementBoundingClientRect.y;

            const menuOptions = {
                menuClass: 'c-conductor__clock-menu',
                placement: this.openmct.menus.menuPlacement.TOP_RIGHT
            };

            this.openmct.menus.showSuperMenu(x, y, this.clocks, menuOptions);
        },
        setClock(clockKey) {
            let option = {
                clockKey
            };
            let configuration = this.getMatchingConfig({
                clock: clockKey,
                timeSystem: this.openmct.time.timeSystem().key
            });

            if (configuration === undefined) {
                configuration = this.getMatchingConfig({
                    clock: clockKey
                });

                option.timeSystem = configuration.timeSystem;
                option.bounds = configuration.bounds;

                // this.openmct.time.timeSystem(configuration.timeSystem, configuration.bounds);
            }

            if (clockKey === undefined) {
                // this.openmct.time.stopClock();
            } else {
                const offsets = this.openmct.time.clockOffsets() || configuration.clockOffsets;
                option.offsets = offsets;
                // this.openmct.time.clock(clockKey, offsets);
            }

            this.$emit('updated', option);
        },
        setMode(modeKey) {
            this.openmct.time.setMode(modeKey, this.openmct.time.bounds());
            this.selectedMode = this.getModeMetadata(modeKey, TEST_IDS);
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
            console.log('set view from clock', clock);
            this.activeClock = clock;
            this.selectedMode = this.getModeMetadata(REALTIME_MODE_KEY, TEST_IDS);
        }
    }
};
</script>
