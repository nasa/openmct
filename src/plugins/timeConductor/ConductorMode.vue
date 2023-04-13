/*****************************************************************************
 * Open MCT Web, Copyright (c) 2014-2023, United States Government
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
    ref="modeButton"
    class="c-ctrl-wrapper c-ctrl-wrapper--menus-up"
>
    <div class="c-menu-button c-ctrl-wrapper c-ctrl-wrapper--menus-left">
        <button
            class="c-button--menu c-mode-button"
            @click.prevent.stop="showModesMenu"
        >
            <span class="c-button__label">{{ selectedMode.name }}</span>
        </button>
    </div>
</div>
</template>

<script>
import toggleMixin from '../../ui/mixins/toggle-mixin';
import modeMixin from './mode-mixin';

const TEST_IDS = true;

export default {
    mixins: [toggleMixin, modeMixin],
    inject: ['openmct', 'configuration'],
    data: function () {
        let activeClock = this.openmct.time.clock();
        if (activeClock !== undefined) {
            //Create copy of active clock so the time API does not get reactified.
            activeClock = Object.create(activeClock);
        }

        return {
            selectedMode: this.getModeOptionForClock(activeClock, TEST_IDS),
            selectedTimeSystem: JSON.parse(JSON.stringify(this.openmct.time.timeSystem())),
            modes: [],
            hoveredMode: {}
        };
    },
    mounted: function () {
        this.loadClocks(this.configuration.menuOptions);

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
        setOption(clockKey) {
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
                const offsets = this.openmct.time.clockOffsets() || configuration.clockOffsets;
                this.openmct.time.clock(clockKey, offsets);
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
            this.selectedMode = this.getModeOptionForClock(clock, TEST_IDS);
        }
    }
};
</script>
