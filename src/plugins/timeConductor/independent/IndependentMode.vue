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
            type: String,
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
        return {
            selectedMode: this.getModeMetadata(this.mode),
            modes: []
        };
    },
    watch: {
        mode: {
            handler(newMode) {
                this.setViewFromMode(newMode);
            }
        },
        enabled(newValue, oldValue) {
            if (newValue !== undefined && (newValue !== oldValue) && (newValue === true)) {
                this.setViewFromMode(this.mode);
            }
        }
    },
    mounted: function () {
        this.loadModes();
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
        setViewFromMode(mode) {
            this.selectedMode = this.getModeMetadata(mode);
        },
        setMode(mode) {
            console.log('set mode');
            this.setViewFromMode(mode);

            this.$emit('independentModeUpdated', mode);
        }
    }
};
</script>
