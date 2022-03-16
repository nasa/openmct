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
                    @click="zoomOut"
            ></button>

            <button class="c-button t-btn-zoom-in icon-plus"
                    title="Zoom in"
                    @click="zoomIn"
            ></button>
        </div>

        <button class="c-button t-btn-zoom-lock"
                title="Lock current zoom and pan across all images"
                :class="{'icon-unlocked': !panZoomLocked, 'icon-lock': panZoomLocked}"
                @click="toggleZoomLock"
        ></button>

        <button class="c-button icon-reset t-btn-zoom-reset"
                title="Remove zoom and pan"
                @click="handleResetImage"
        ></button>

        <span class="c-image-controls__zoom-factor">x{{ formattedZoomFactor }}</span>
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
import _ from 'lodash';

const DEFAULT_FILTER_VALUES = {
    brightness: '100',
    contrast: '100'
};

const ZOOM_LIMITS_MAX_DEFAULT = 20;
const ZOOM_LIMITS_MIN_DEFAULT = 1;
const ZOOM_STEP = 1;

export default {
    inject: ['openmct', 'domainObject'],
    props: {
        zoomFactor: {
            type: Number,
            required: true
        },
        imageUrl: String
    },
    data() {
        return {
            altPressed: false,
            shiftPressed: false,
            metaPressed: false,
            panZoomLocked: false,
            wheelZooming: false,
            filters: {
                brightness: 100,
                contrast: 100
            }
        };
    },
    computed: {
        formattedZoomFactor() {
            return Number.parseFloat(this.zoomFactor).toPrecision(2);
        },
        cursorStates() {
            const isPannable = this.altPressed && this.zoomFactor > 1;
            const showCursorZoomIn = this.metaPressed && !this.shiftPressed;
            const showCursorZoomOut = this.metaPressed && this.shiftPressed;
            const modifierKeyPressed = Boolean(this.metaPressed || this.shiftPressed || this.altPressed);

            return {
                isPannable,
                showCursorZoomIn,
                showCursorZoomOut,
                modifierKeyPressed
            };
        }
    },
    watch: {
        imageUrl(newUrl, oldUrl) {
            // reset image pan/zoom if newUrl only if not locked
            if (newUrl && !this.panZoomLocked) {
                this.$emit('resetImage');
            }
        },
        cursorStates(states) {
            this.$emit('cursorsUpdated', states);
        }
    },
    mounted() {
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
        this.clearWheelZoom = _.debounce(this.clearWheelZoom, 600);
    },
    beforeDestroy() {
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
    },
    methods: {
        handleResetImage() {
            this.$emit('resetImage');
        },
        handleUpdatePanZoom(options) {
            this.$emit('panZoomUpdated', options);
        },
        toggleZoomLock() {
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
        limitZoomRange(factor) {
            return Math.min(Math.max(ZOOM_LIMITS_MIN_DEFAULT, factor), ZOOM_LIMITS_MAX_DEFAULT);
        },
        // used to increment the zoom without knowledge of current level
        processZoom(increment, userCoordX, userCoordY) {
            const newFactor = this.limitZoomRange(this.zoomFactor + increment);
            this.zoomImage(newFactor, userCoordX, userCoordY);
        },
        zoomImage(newScaleFactor, screenClientX, screenClientY) {
            if (!(newScaleFactor || Number.isInteger(newScaleFactor))) {
                console.error('Scale factor provided is invalid');

                return;
            }

            if (newScaleFactor > ZOOM_LIMITS_MAX_DEFAULT) {
                newScaleFactor = ZOOM_LIMITS_MAX_DEFAULT;
            }

            if (newScaleFactor <= 0 || newScaleFactor <= ZOOM_LIMITS_MIN_DEFAULT) {
                return this.handleResetImage();
            }

            this.handleUpdatePanZoom({
                newScaleFactor,
                screenClientX,
                screenClientY
            });
        },
        wheelZoom(e) {
            // only use x,y coordinates on scrolling in
            if (this.wheelZooming === false && e.deltaY > 0) {
                this.wheelZooming = true;

                // grab first x,y coordinates
                this.processZoom(e.deltaY * 0.01, e.clientX, e.clientY);
            } else {
                // ignore subsequent event x,y so scroll drift doesn't occur
                this.processZoom(e.deltaY * 0.01);
            }

            // debounced method that will only fire after the scroll series is complete
            this.clearWheelZoom();
        },
        /* debounced method so that wheelZooming state will
        ** remain true through a zoom event series
        */
        clearWheelZoom() {
            this.wheelZooming = false;
        },
        handleKeyDown(event) {
            if (event.key === 'Alt') {
                this.altPressed = true;
            }

            if (event.metaKey) {
                this.metaPressed = true;
            }

            if (event.shiftKey) {
                this.shiftPressed = true;
            }
        },
        handleKeyUp(event) {
            if (event.key === 'Alt') {
                this.altPressed = false;
            }

            this.shiftPressed = false;
            if (!event.metaKey) {
                this.metaPressed = false;
            }
        },
        zoomIn() {
            this.processZoom(ZOOM_STEP);
        },
        zoomOut() {
            this.processZoom(-ZOOM_STEP);
        },
        // attached to onClick listener in ImageryView
        handlePanZoomClick(e) {
            if (this.altPressed) {
                return this.$emit('startPan', e);
            }

            if (!(this.metaPressed && e.button === 0)) {
                return;
            }

            const newScaleFactor = this.zoomFactor + (this.shiftPressed ? -ZOOM_STEP : ZOOM_STEP);
            this.zoomImage(newScaleFactor, e.clientX, e.clientY);
        }
    }
};
</script>
