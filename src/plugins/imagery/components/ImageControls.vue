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
                    @click="incrementZoomFactor(-1)"
            ></button>

            <button class="c-button t-btn-zoom-in icon-plus"
                    title="Zoom in"
                    @click="incrementZoomFactor(1)"
            ></button>
        </div>

        <button class="c-button t-btn-zoom-lock"
                title="Lock current zoom and pan across all images"
                :class="{'icon-unlocked': !panZoomLocked, 'icon-lock': panZoomLocked}"
                @click="toggleLock"
        ></button>

        <button class="c-button icon-reset t-btn-zoom-reset"
                title="Remove zoom and pan"
                @click="handleResetImage"
        ></button>

        <span class="c-image-controls__zoom-factor">x{{ zoomFactor }}</span>
    </div>
    <div class="c-image-controls__control c-image-controls__brightness-contrast">
        <span
            class="c-image-controls__sliders"
            draggable="true"
            @dragstart="startDrag"
        >
            <div class="c-image-controls__input icon-brightness">
                <input
                    v-model="filters.contrast"
                    type="range"
                    min="0"
                    max="500"
                    @change="notifyFiltersChanged"
                >
            </div>
            <div class="c-image-controls__input icon-contrast">
                <input
                    v-model="filters.brightness"
                    type="range"
                    min="0"
                    max="500"
                    @change="notifyFiltersChanged"
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

const ZOOM_LIMITS_MAX_DEFAULT = 20;
const ZOOM_LIMITS_MIN_DEFAULT = 1;

export default {
    inject: ['openmct', 'domainObject'],
    props: {
        formattedZoomFactor: {
            type: Number,
            default() {
                return 1;
            }
        }
    },
    data() {
        return {
            altPressed: false,
            shiftPressed: false,
            metaPressed: false,
            panZoomLocked: false,
            zoomFactor: 1,
            filters: {
                brightness: 100,
                contrast: 100
            }
        };
    },
    watch: {
        formattedZoomFactor(newZoomFactor) {
            this.zoomFactor = newZoomFactor;
        }
    },
    methods: {
        handleResetImage() {
            this.$emit('resetImage', true);
        },
        handleUpdatePanZoom(options) {
            this.$emit('panZoomUpdated', options);
        },
        toggleLock() {
            this.panZoomLocked = !this.panZoomLocked;
        },
        notifyFiltersChanged() {
            this.$emit('filtersUpdated', this.filters);
        },
        handleResetFilters() {
            this.filters = DEFAULT_FILTER_VALUES;
            this.notifyFiltersChanged();
        },
        startDrag(e) {
            e.preventDefault();
            e.stopPropagation();
        },
        // used to increment the zoom without knowledge of current level
        incrementZoomFactor(increment, userCoordX, userCoordY) {
            const newFactor = this.zoomFactor + increment;
            this.zoomImage(newFactor, userCoordX, userCoordY);
        },
        zoomImage(newScaleFactor, screenClientX, screenClientY) {
            if (newScaleFactor > ZOOM_LIMITS_MAX_DEFAULT) {
                newScaleFactor = ZOOM_LIMITS_MAX_DEFAULT;

                return;
            }

            if (newScaleFactor <= 0 || newScaleFactor < ZOOM_LIMITS_MIN_DEFAULT) {
                this.zoomFactor = 1;
                this.panZoomLocked = false;

                return this.handleResetImage(true);
            }

            this.handleUpdatePanZoom({
                newScaleFactor,
                screenClientX,
                screenClientY
            });
        }

    }
};
</script>
