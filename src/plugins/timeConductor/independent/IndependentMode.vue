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
    ref="modeMenuButton"
    class="c-ctrl-wrapper c-ctrl-wrapper--menus-up"
>
    <div class="c-menu-button c-ctrl-wrapper c-ctrl-wrapper--menus-left">
        <button
            class="c-icon-button c-button--menu js-mode-button"
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
</template>

<script>
import toggleMixin from '../../../ui/mixins/toggle-mixin';
import modeMixin from '../mode-mixin';
import { TIME_CONTEXT_EVENTS, REALTIME_MODE_KEY, FIXED_MODE_KEY } from '../../../api/time/constants';

export default {
    mixins: [toggleMixin, modeMixin],
    inject: ['openmct'],
    props: {
        mode: {
            type: Object,
            default() {
                return undefined;
            }
        },
        enabled: {
            type: Boolean,
            default() {
                return false;
            }
        }
    },
    data: function () {
        let mode = FIXED_MODE_KEY;
        if (this.mode?.key !== FIXED_MODE_KEY) {
            mode = REALTIME_MODE_KEY;
        }

        return {
            selectedMode: this.getModeMetadata(mode),
            modes: []
        };
    },
    watch: {
        mode: {
            deep: true,
            handler(newMode) {
                if (newMode) {
                    this.setMode(newMode.key === FIXED_MODE_KEY ? undefined : newMode);
                }
            }
        },
        enabled(newValue, oldValue) {
            if (newValue !== undefined && (newValue !== oldValue) && (newValue === true)) {
                this.setMode(this.mode.key === FIXED_MODE_KEY ? undefined : this.mode);
            }
        }
    },
    mounted: function () {
        if (this.mode) {
            this.setMode(this.mode.key === FIXED_MODE_KEY ? undefined : this.mode);
        }
    },
    methods: {
        showModesMenu() {
            const elementBoundingClientRect = this.$refs.modeMenuButton.getBoundingClientRect();
            const x = elementBoundingClientRect.x;
            const y = elementBoundingClientRect.y + elementBoundingClientRect.height;

            const menuOptions = {
                menuClass: 'c-conductor__mode-menu',
                placement: this.openmct.menus.menuPlacement.BOTTOM_RIGHT
            };
            this.openmct.menus.showSuperMenu(x, y, this.modes, menuOptions);
        },
        getMenuOptions() {
            let menuOptions = [{
                name: 'Fixed Timespan',
                timeSystem: 'utc'
            }];
            let currentGlobalClock = this.getActiveClock();
            if (currentGlobalClock !== undefined) {
            //Create copy of active clock so the time API does not get reactified.
                currentGlobalClock = Object.assign({}, {
                    name: currentGlobalClock.name,
                    clock: currentGlobalClock.key,
                    timeSystem: this.openmct.time.timeSystem().key
                });

                menuOptions.push(currentGlobalClock);
            }

            return menuOptions;
        },
        setMode(key) {
            const matchingOptions = this.getMenuOptions().filter(option => option.clock === key);
            const clock = matchingOptions.length && matchingOptions[0].clock ? Object.assign({}, matchingOptions[0], { key: matchingOptions[0].clock }) : undefined;
            this.selectedMode = this.getModeMetadata(clock);

            if (this.mode) {
                this.$emit(TIME_CONTEXT_EVENTS.modeChanged, { key });
            }
        }
        // setMode(clock) {
        //     const menuOptions = this.getMenuOptions();
        //     this.loadModes(menuOptions);
        //     //retain the mode chosen by the user
        //     if (this.mode) {
        //         let found = this.modes.find(mode => mode.key === this.selectedMode.key);

        //         if (!found) {
        //             found = this.modes.find(mode => mode.key === clock && clock.key);
        //             this.setMode(found ? this.getModeMetadata(clock).key : this.getModeMetadata().key);
        //         } else if (this.mode.key !== this.selectedMode.key) {
        //             this.setMode(this.selectedMode.key);
        //         }
        //     } else {
        //         this.setMode(this.getModeMetadata(clock).key);
        //     }
        // }
    }
};
</script>
