/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2022, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
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
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

<template>
<div class="h-local-controls h-local-controls--overlay-content c-local-controls--show-on-hover c-image-controls__controls">
    <div class="c-image-controls__control c-image-controls__zoom icon-magnify">
        <div class="c-button-set c-button-set--strip-h">
            <button class="c-button t-btn-zoom-out icon-minus"
                    title="Zoom out"
                    @click="handleZoomButton(-1)"
            ></button>

            <button class="c-button t-btn-zoom-in icon-plus"
                    title="Zoom in"
                    @click="handleZoomButton(1)"
            ></button>
        </div>

        <button class="c-button t-btn-zoom-lock"
                title="Lock current zoom and pan across all images"
                :class="{'icon-unlocked': !panZoomLocked, 'icon-lock': panZoomLocked}"
                @click="handleToggleLock"
        ></button>

        <button class="c-button icon-reset t-btn-zoom-reset"
                title="Remove zoom and pan"
                @click="handleResetImage"
        ></button>

        <span class="c-image-controls__zoom-factor">x{{zoomFactor}}</span>
    </div>
    <div class="c-image-controls__control c-image-controls__brightness-contrast">
        <span
            class="c-image-controls__sliders"
            draggable="true"
            @dragstart="startDrag"
        >
            <div class="c-image-controls__input icon-brightness">
                <input
                    v-model="filtersBrightness"
                    type="range"
                    min="0"
                    max="500"
                >
            </div>
            <div class="c-image-controls__input icon-contrast">
                <input
                    v-model="filtersContrast"
                    type="range"
                    min="0"
                    max="500"
                >
            </div>
        </span>
        <span class="t-reset-btn-holder c-imagery__lc__reset-btn c-image-controls__btn-reset">
            <button class="c-icon-link icon-reset t-btn-reset"
                    @click="handleResetFilters"
            ></button>
        </span>
    </div>
</div>
</template>

<script>

const DEFAULT_FILTER_VALUES = {
    brightness: '100',
    contrast: '100'
};
export default {

    props: {
        filters: {
            type: Object,
            default() {
                return DEFAULT_FILTER_VALUES;
            }
        },
        panZoomLocked: Boolean,
        zoomFactor: {
            type: String,
            default() {
                return '1';
            }
        }
    },
    computed: {
        filtersContrast: {

            get() {
                return this.filters.contrast;
            },
            set(contrast) {
                this.$emit('setFilters', {
                    ...this.filters,
                    contrast
                });
            }
        },
        filtersBrightness: {
            get() {
                return this.filters.brightness;
            },
            set(brightness) {
                this.$emit('setFilters', {
                    ...this.filters,
                    brightness
                });
            }

        }
    },
    methods: {
        handleResetImage() {
            this.$emit('resetImage', true);
        },

        handleZoomButton(stepValue) {
            this.$emit('incrementZoomFactor', stepValue);
        },
        handleToggleLock() {
            this.$emit('togglePanZoomLock');
        },
        handleResetFilters() {
            this.$emit('setFilters', DEFAULT_FILTER_VALUES);
        },

        startDrag(e) {
            e.preventDefault();
            e.stopPropagation();
        }

    }
};
</script>
