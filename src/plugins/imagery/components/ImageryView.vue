/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2021, United States Government
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
<div
    tabindex="0"
    class="c-imagery"
    @keyup="arrowUpHandler"
    @keydown="arrowDownHandler"
    @mouseover="focusElement"
>
    <div class="c-imagery__main-image-wrapper has-local-controls">
        <div class="h-local-controls h-local-controls--overlay-content c-local-controls--show-on-hover c-image-controls__controls">
            <div class="c-image-controls__control c-image-controls__zoom icon-magnify">
                <div class="c-button-set c-button-set--strip-h">
                    <button class="c-button t-btn-zoom-out icon-minus"
                            @click="handleZoomButton(-1)"
                    ></button>

                    <button class="c-button t-btn-zoom-in icon-plus"
                            @click="handleZoomButton(1)"
                    ></button>
                </div>

                <button class="c-button t-btn-zoom-lock"
                        :class="{'icon-unlocked': !panZoomLocked, 'icon-lock': panZoomLocked}"
                        @click="lockPanZoomPosition"
                ></button>

                <button class="c-button icon-reset t-btn-zoom-reset"
                        @click="resetImage(true)"
                ></button>

                <span class="c-image-controls__zoom-factor">x{{ Number.parseFloat(zoomFactor).toPrecision(2) }}</span>
            </div>
            <div class="c-image-controls__control c-image-controls__brightness-contrast">
                <span class="c-image-controls__sliders"
                      draggable="true"
                      @dragstart="startDrag"
                >
                    <div class="c-image-controls__input icon-brightness">
                        <input v-model="filters.brightness"
                               type="range"
                               min="0"
                               max="500"
                        >
                    </div>
                    <div class="c-image-controls__input icon-contrast">
                        <input v-model="filters.contrast"
                               type="range"
                               min="0"
                               max="500"
                        >
                    </div>
                </span>
                <span class="t-reset-btn-holder c-imagery__lc__reset-btn c-image-controls__btn-reset">
                    <button class="c-icon-link icon-reset t-btn-reset"
                            @click="filters={brightness: 100, contrast: 100}"
                    ></button>
                </span>
            </div>
        </div>

        <div ref="imageBG"
             class="c-imagery__main-image__bg"
             :class="{'paused unnsynced': isPaused && !isFixed,'stale':false,'selectable': isSelectable, 'pannable': altPressed && zoomFactor > 1}"
             @click="expand"
        >
            <div ref="focusedImageWrapper"
                 class="image-wrapper"
                 :style="{
                     'width': `${sizedImageDimensions.width}px`,
                     'height': `${sizedImageDimensions.height}px`,
                     'overflow': 'hidden',
                     'background-image': 'repeating-linear-gradient(45deg, transparent, transparent 4px, rgba(125, 125, 125, 0.2) 4px, rgba(125, 125, 125, 0.2) 8px)'
                 }"
            >
                <img ref="focusedImage"
                     class="c-imagery__main-image__image js-imageryView-image "
                     :src="imageUrl"
                     :draggable="!isSelectable"
                     :style="{
                         'filter': `brightness(${filters.brightness}%) contrast(${filters.contrast}%)`,
                         'visibility': 'inherit',
                         'display': 'contents'
                     }"
                     :data-openmct-image-timestamp="time"
                     :data-openmct-object-keystring="keyString"
                >
                <!-- <canvas
                    ref="focusedImageCanvas"
                    :style="{
                        'z-index': 10,
                        'width': `${sizedImageDimensions.width} px`,
                        'height': `${sizedImageDimensions.height} px`,
                        'visibility': 'hidden'
                    }">
                </canvas> -->
                <div
                    ref="focusedImageElement"
                    class="c-imagery_main-image_background-image"
                    :style="{
                        'filter': `brightness(${filters.brightness}%) contrast(${filters.contrast}%)`,
                        'background-image':
                            `url(${imageUrl}),
                            repeating-linear-gradient(
                                45deg,
                                transparent,
                                transparent 4px,
                                rgba(125,125,125,.2) 4px,
                                rgba(125,125,125,.2) 8px
                            )`,
                        'transform': `scale(${zoomFactor}) translate(${imageTranslateX}px, ${imageTranslateY}px)`,
                        'background-position': 'center',
                        'background-repeat': 'no-repeat',
                        'background-position': 'contain',

                        'transition': `${!pan && animateZoom ? 'transform 250ms ease-in' : 'initial'}`,
                        'width': `${sizedImageDimensions.width}px`,
                        'height': `${sizedImageDimensions.height}px`,

                    }"
                    :data-openmct-image-timestamp="time"
                    :data-openmct-object-keystring="keyString"
                    @mousedown="handlePanZoomClick"
                ></div>
                <!-- <div :style="{
                    'position': 'absolute',
                    'left': 0,
                    'top': 0,
                    'right': 0,
                    'bottom': 0,
                    'margin': 'auto',
                    'width': '16px',
                    'height': '16px',
                    'background': 'rgba(255,0,0,0.8)',
                    'border-radius': '50%',
                    'pointer-events': 'none'
                }"></div> -->
                <Compass
                    v-if="shouldDisplayCompass"
                    :compass-rose-sizing-classes="compassRoseSizingClasses"
                    :image="focusedImage"
                    :natural-aspect-ratio="focusedImageNaturalAspectRatio"
                    :sized-image-dimensions="sizedImageDimensions"
                />
            </div>
        </div>

        <button class="c-local-controls c-local-controls--show-on-hover c-imagery__prev-next-button c-nav c-nav--prev"
                title="Previous image"
                :disabled="isPrevDisabled"
                @click="prevImage()"
        ></button>

        <button class="c-local-controls c-local-controls--show-on-hover c-imagery__prev-next-button c-nav c-nav--next"
                title="Next image"
                :disabled="isNextDisabled"
                @click="nextImage()"
        ></button>

        <div class="c-imagery__control-bar">
            <div class="c-imagery__time">
                <div class="c-imagery__timestamp u-style-receiver js-style-receiver">{{ time }}</div>

                <!-- image fresh -->
                <div
                    v-if="canTrackDuration"
                    :class="{'c-imagery--new': isImageNew && !refreshCSS}"
                    class="c-imagery__age icon-timer"
                >{{ formattedDuration }}</div>

                <!-- spacecraft position fresh -->
                <div
                    v-if="relatedTelemetry.hasRelatedTelemetry && isSpacecraftPositionFresh"
                    class="c-imagery__age icon-check c-imagery--new"
                >POS</div>

                <!-- camera position fresh -->
                <div
                    v-if="relatedTelemetry.hasRelatedTelemetry && isCameraPositionFresh"
                    class="c-imagery__age icon-check c-imagery--new"
                >CAM</div>
            </div>
            <div class="h-local-controls">
                <button
                    v-if="!isFixed"
                    class="c-button icon-pause pause-play"
                    :class="{'is-paused': isPaused}"
                    @click="paused(!isPaused, 'button')"
                ></button>
            </div>
        </div>
    </div>
    <div class="c-imagery__thumbs-wrapper"
         :class="[
             { 'is-paused': isPaused && !isFixed },
             { 'is-autoscroll-off': !resizingWindow && !autoScroll && !isPaused }
         ]"
    >
        <div
            ref="thumbsWrapper"
            class="c-imagery__thumbs-scroll-area"
            @scroll="handleScroll"
        >
            <div v-for="(image, index) in imageHistory"
                 :key="image.url + image.time"
                 class="c-imagery__thumb c-thumb"
                 :class="{ selected: focusedImageIndex === index && isPaused }"
                 @click="setFocusedImage(index, thumbnailClick)"
            >
                <a href=""
                   :download="image.imageDownloadName"
                   @click.prevent
                >
                    <img class="c-thumb__image"
                         :src="image.url"
                    >
                </a>
                <div class="c-thumb__timestamp">{{ image.formattedTime }}</div>
            </div>
        </div>

        <button
            class="c-imagery__auto-scroll-resume-button c-icon-button icon-play"
            title="Resume automatic scrolling of image thumbnails"
            @click="scrollToRight('reset')"
        ></button>
    </div>
</div>
</template>

<script>
import eventHelpers from '../lib/eventHelpers';
import _ from 'lodash';
import moment from 'moment';

import RelatedTelemetry from './RelatedTelemetry/RelatedTelemetry';
import Compass from './Compass/Compass.vue';

import imageryData from "../../imagery/mixins/imageryData";

const REFRESH_CSS_MS = 500;
const DURATION_TRACK_MS = 1000;
const ARROW_DOWN_DELAY_CHECK_MS = 400;
const ARROW_SCROLL_RATE_MS = 100;
const THUMBNAIL_CLICKED = true;

const ONE_MINUTE = 60 * 1000;
const FIVE_MINUTES = 5 * ONE_MINUTE;
const ONE_HOUR = ONE_MINUTE * 60;
const EIGHT_HOURS = 8 * ONE_HOUR;
const TWENTYFOUR_HOURS = EIGHT_HOURS * 3;

const ARROW_RIGHT = 39;
const ARROW_LEFT = 37;

const SCROLL_LATENCY = 250;


const ZOOM_LIMITS_MAX_DEFAULT = 20;
const ZOOM_LIMITS_MIN_DEFAULT = 1;

export default {
    components: {
        Compass
    },
    mixins: [imageryData],
    inject: ['openmct', 'domainObject', 'objectPath', 'currentView'],
    props: {
        indexForFocusedImage: {
            type: Number,
            default() {
                return undefined;
            }
        }
    },
    data() {
        let timeSystem = this.openmct.time.timeSystem();
        this.metadata = {};
        this.requestCount = 0;

        return {
            durationFormatter: undefined,
            imageHistory: [],
            timeSystem: timeSystem,
            keyString: undefined,
            autoScroll: true,
            filters: {
                brightness: 100,
                contrast: 100
            },
            thumbnailClick: THUMBNAIL_CLICKED,
            isPaused: false,
            refreshCSS: false,
            focusedImageIndex: undefined,
            focusedImageRelatedTelemetry: {},
            numericDuration: undefined,
            relatedTelemetry: {},
            latestRelatedTelemetry: {},
            focusedImageNaturalAspectRatio: undefined,
            imageContainerWidth: undefined,
            imageContainerHeight: undefined,
            lockCompass: true,
            resizingWindow: false,
            timeContext: undefined,
            altPressed: false,
            zoomFactor: 1,
            imageTranslateX: 0,
            imageTranslateY: 0,
            pan: undefined,
            animateZoom: true,
            imagePanned: false,
            wheelZooming: false,
            panZoomLocked: false
        };
    },
    computed: {
        imageHistorySize() {
            return this.imageHistory.length;
        },
        compassRoseSizingClasses() {
            let compassRoseSizingClasses = '';
            if (this.sizedImageDimensions.width < 300) {
                compassRoseSizingClasses = '--rose-small --rose-min';
            } else if (this.sizedImageDimensions.width < 500) {
                compassRoseSizingClasses = '--rose-small';
            } else if (this.sizedImageDimensions.width > 1000) {
                compassRoseSizingClasses = '--rose-max';
            }

            return compassRoseSizingClasses;
        },
        time() {
            return this.formatTime(this.focusedImage);
        },
        imageUrl() {
            return this.formatImageUrl(this.focusedImage);
        },
        isImageNew() {
            let cutoff = FIVE_MINUTES;
            let age = this.numericDuration;

            return age < cutoff && !this.refreshCSS;
        },
        canTrackDuration() {
            let hasClock;
            if (this.timeContext) {
                hasClock = this.timeContext.clock();
            } else {
                hasClock = this.openmct.time.clock();
            }

            return hasClock && this.timeSystem.isUTCBased;
        },
        isNextDisabled() {
            let disabled = false;

            if (this.focusedImageIndex === -1 || this.focusedImageIndex === this.imageHistory.length - 1) {
                disabled = true;
            }

            return disabled;
        },
        isPrevDisabled() {
            let disabled = false;

            if (this.focusedImageIndex === 0 || this.imageHistory.length < 2) {
                disabled = true;
            }

            return disabled;
        },
        focusedImage() {
            return this.imageHistory[this.focusedImageIndex];
        },
        parsedSelectedTime() {
            return this.parseTime(this.focusedImage);
        },
        formattedDuration() {
            let result = 'N/A';
            let negativeAge = -1;

            if (this.numericDuration > TWENTYFOUR_HOURS) {
                negativeAge *= (this.numericDuration / TWENTYFOUR_HOURS);
                result = moment.duration(negativeAge, 'days').humanize(true);
            } else if (this.numericDuration > EIGHT_HOURS) {
                negativeAge *= (this.numericDuration / ONE_HOUR);
                result = moment.duration(negativeAge, 'hours').humanize(true);
            } else if (this.durationFormatter) {
                result = this.durationFormatter.format(this.numericDuration);
            }

            return result;
        },
        shouldDisplayCompass() {
            return this.focusedImage !== undefined
                && this.focusedImageNaturalAspectRatio !== undefined
                && this.imageContainerWidth !== undefined
                && this.imageContainerHeight !== undefined
                && this.zoomFactor === 1
                && this.imagePanned !== true;
        },
        isSpacecraftPositionFresh() {
            let isFresh = undefined;
            let latest = this.latestRelatedTelemetry;
            let focused = this.focusedImageRelatedTelemetry;

            if (this.relatedTelemetry.hasRelatedTelemetry) {
                isFresh = true;
                for (let key of this.spacecraftPositionKeys) {
                    if (this.relatedTelemetry[key] && latest[key] && focused[key]) {
                        isFresh = isFresh && Boolean(this.relatedTelemetry[key].comparisonFunction(latest[key], focused[key]));
                    } else {
                        isFresh = false;
                    }
                }
            }

            return isFresh;
        },
        isSpacecraftOrientationFresh() {
            let isFresh = undefined;
            let latest = this.latestRelatedTelemetry;
            let focused = this.focusedImageRelatedTelemetry;

            if (this.relatedTelemetry.hasRelatedTelemetry) {
                isFresh = true;
                for (let key of this.spacecraftOrientationKeys) {
                    if (this.relatedTelemetry[key] && latest[key] && focused[key]) {
                        isFresh = isFresh && Boolean(this.relatedTelemetry[key].comparisonFunction(latest[key], focused[key]));
                    } else {
                        isFresh = false;
                    }
                }
            }

            return isFresh;
        },
        isCameraPositionFresh() {
            let isFresh = undefined;
            let latest = this.latestRelatedTelemetry;
            let focused = this.focusedImageRelatedTelemetry;

            if (this.relatedTelemetry.hasRelatedTelemetry) {
                isFresh = true;

                // camera freshness relies on spacecraft position freshness
                if (this.isSpacecraftPositionFresh && this.isSpacecraftOrientationFresh) {
                    for (let key of this.cameraKeys) {
                        if (this.relatedTelemetry[key] && latest[key] && focused[key]) {
                            isFresh = isFresh && Boolean(this.relatedTelemetry[key].comparisonFunction(latest[key], focused[key]));
                        } else {
                            isFresh = false;
                        }
                    }
                } else {
                    isFresh = false;
                }
            }

            return isFresh;
        },
        sizedImageDimensions() {
            let sizedImageDimensions = {};
            if ((this.imageContainerWidth / this.imageContainerHeight) > this.focusedImageNaturalAspectRatio) {
                // container is wider than image
                sizedImageDimensions.width = this.imageContainerHeight * this.focusedImageNaturalAspectRatio;
                sizedImageDimensions.height = this.imageContainerHeight;
            } else {
                // container is taller than image
                sizedImageDimensions.width = this.imageContainerWidth;
                sizedImageDimensions.height = this.imageContainerWidth / this.focusedImageNaturalAspectRatio;
            }

            return sizedImageDimensions;
        },
        isFixed() {
            let clock;
            if (this.timeContext) {
                clock = this.timeContext.clock();
            } else {
                clock = this.openmct.time.clock();
            }

            return clock === undefined;
        },
        isSelectable() {
            return true;

        }
    },
    watch: {
        imageUrl(newUrl, oldUrl) {
            if (newUrl) {
                // this.drawCanvas(newUrl)
                this.resetImage();
            }
        },
        imageHistorySize(newSize, oldSize) {
            let imageIndex;
            if (this.indexForFocusedImage !== undefined) {
                imageIndex = this.initFocusedImageIndex;
            } else {
                imageIndex = newSize - 1;
            }

            this.setFocusedImage(imageIndex, false);
            this.scrollToRight();
        },
        focusedImageIndex() {
            this.trackDuration();
            this.resetAgeCSS();
            this.updateRelatedTelemetryForFocusedImage();
            this.getImageNaturalDimensions();
        }
    },

    async mounted() {
        eventHelpers.extend(this);
        this.focusedImageWrapper = this.$refs.focusedImageWrapper;
        this.focusedImageElement = this.$refs.focusedImageElement;
        document.addEventListener('keydown', this.handleKeyDown);
        document.addEventListener('keyup', this.handleKeyUp);
        // this.canvas = this.$refs.focusedImageCanvas;
        // this.context = this.canvas.getContext('2d');
        // this.context.imageSmoothingEnabled = false;

        //We only need to use this till the user focuses an image manually
        if (this.indexForFocusedImage !== undefined) {
            this.initFocusedImageIndex = this.indexForFocusedImage;
            this.isPaused = true;
        }

        this.setTimeContext = this.setTimeContext.bind(this);
        this.setTimeContext();

        // related telemetry keys
        this.spacecraftPositionKeys = ['positionX', 'positionY', 'positionZ'];
        this.spacecraftOrientationKeys = ['heading'];
        this.cameraKeys = ['cameraPan', 'cameraTilt'];
        this.sunKeys = ['sunOrientation'];

        // related telemetry
        await this.initializeRelatedTelemetry();
        await this.updateRelatedTelemetryForFocusedImage();
        this.trackLatestRelatedTelemetry();

        // for scrolling through images quickly and resizing the object view
        this.updateRelatedTelemetryForFocusedImage = _.debounce(this.updateRelatedTelemetryForFocusedImage, 400);

        // for resizing the object view
        this.resizeImageContainer = _.debounce(this.resizeImageContainer, 400);

        if (this.$refs.imageBG) {
            this.imageContainerResizeObserver = new ResizeObserver(this.resizeImageContainer);
            this.imageContainerResizeObserver.observe(this.$refs.imageBG);
        }

        // For adjusting scroll bar size and position when resizing thumbs wrapper
        this.handleScroll = _.debounce(this.handleScroll, SCROLL_LATENCY);
        this.handleThumbWindowResizeEnded = _.debounce(this.handleThumbWindowResizeEnded, SCROLL_LATENCY);
        this.handleThumbWindowResizeStart = _.debounce(this.handleThumbWindowResizeStart, SCROLL_LATENCY);

        if (this.$refs.thumbsWrapper) {
            this.thumbWrapperResizeObserver = new ResizeObserver(this.handleThumbWindowResizeStart);
            this.thumbWrapperResizeObserver.observe(this.$refs.thumbsWrapper);
        }

        // initialize pan/zoom features
        // this.listenTo(imageElement, 'mousemove', this.trackMousePosition, this);
        // this.listenTo(imageElement, 'mouseleave', this.untrackMousePosition, this);
        // this.listenTo(imageElement, 'mousedown', this.onMouseDown, this);
        // this.listenTo(this.focusedImageWrapper, 'gesturestop', this.handleGesture, this);
        this.clearWheelZoom = _.debounce(this.clearWheelZoom, 600);
        this.listenTo(this.focusedImageWrapper, 'wheel', this.wheelZoom, this);
        // this.marquee = undefined;
        // this.drawCanvas()

    },
    beforeDestroy() {
        this.stopFollowingTimeContext();

        if (this.thumbWrapperResizeObserver) {
            this.thumbWrapperResizeObserver.disconnect();
        }

        if (this.imageContainerResizeObserver) {
            this.imageContainerResizeObserver.disconnect();
        }

        if (this.relatedTelemetry.hasRelatedTelemetry) {
            this.relatedTelemetry.destroy();
        }

        // unsubscribe from related telemetry
        if (this.relatedTelemetry.hasRelatedTelemetry) {
            for (let key of this.relatedTelemetry.keys) {
                if (this.relatedTelemetry[key] && this.relatedTelemetry[key].unsubscribe) {
                    this.relatedTelemetry[key].unsubscribe();
                }
            }
        }

        // remove mouse listeners for pan/zoom functionality
        // this.stopListening(this.imageElement, 'mousemove', this.trackMousePosition, this);
        // this.stopListening(this.imageElement, 'mouseleave', this.untrackMousePosition, this);
        // this.stopListening(this.imageElement, 'mousedown', this.onMouseDown, this)
        // this.stopListening(this.focusedImageWrapper, 'gesturechange', this.handleGesture, this);
        this.stopListening(this.focusedImageWrapper, 'wheel', this.wheelZoom, this);
        document.removeEventListener('keydown', this.handleKeyDown);
        document.removeEventListener('keyup', this.handleKeyUp);
    },
    methods: {

        setTimeContext() {
            this.stopFollowingTimeContext();
            this.timeContext = this.openmct.time.getContextForView(this.objectPath);
            //listen
            this.timeContext.on('timeSystem', this.trackDuration);
            this.timeContext.on('clock', this.trackDuration);
            this.timeContext.on("timeContext", this.setTimeContext);
        },
        stopFollowingTimeContext() {
            if (this.timeContext) {
                this.timeContext.off("timeSystem", this.trackDuration);
                this.timeContext.off("clock", this.trackDuration);
                this.timeContext.off("timeContext", this.setTimeContext);
            }
        },
        expand() {
            const actionCollection = this.openmct.actions.getActionsCollection(this.objectPath, this.currentView);
            const visibleActions = actionCollection.getVisibleActions();
            const viewLargeAction = visibleActions
                && visibleActions.find(action => action.key === 'large.view');

            if (viewLargeAction && viewLargeAction.appliesTo(this.objectPath, this.currentView)) {
                viewLargeAction.onItemClicked();
            }
        },
        async initializeRelatedTelemetry() {
            this.relatedTelemetry = new RelatedTelemetry(
                this.openmct,
                this.domainObject,
                [...this.spacecraftPositionKeys, ...this.spacecraftOrientationKeys, ...this.cameraKeys, ...this.sunKeys]
            );

            if (this.relatedTelemetry.hasRelatedTelemetry) {
                await this.relatedTelemetry.load();
            }
        },
        async getMostRecentRelatedTelemetry(key, targetDatum) {
            if (!this.relatedTelemetry.hasRelatedTelemetry) {
                throw new Error(`${this.domainObject.name} does not have any related telemetry`);
            }

            if (!this.relatedTelemetry[key]) {
                throw new Error(`${key} does not exist on related telemetry`);
            }

            let mostRecent;
            let valueKey = this.relatedTelemetry[key].historical.valueKey;
            let valuesOnTelemetry = this.relatedTelemetry[key].hasTelemetryOnDatum;

            if (valuesOnTelemetry) {
                mostRecent = targetDatum[valueKey];

                if (mostRecent) {
                    return mostRecent;
                } else {
                    console.warn(`Related Telemetry for ${key} does NOT exist on this telemetry datum as configuration implied.`);

                    return;
                }
            }

            mostRecent = await this.relatedTelemetry[key].requestLatestFor(targetDatum);

            return mostRecent[valueKey];
        },
        // will subscribe to data for this key if not already done
        subscribeToDataForKey(key) {
            if (this.relatedTelemetry[key].isSubscribed) {
                return;
            }

            if (this.relatedTelemetry[key].realtimeDomainObject) {
                this.relatedTelemetry[key].unsubscribe = this.openmct.telemetry.subscribe(
                    this.relatedTelemetry[key].realtimeDomainObject, datum => {
                        this.relatedTelemetry[key].listeners.forEach(callback => {
                            callback(datum);
                        });

                    }
                );

                this.relatedTelemetry[key].isSubscribed = true;
            }
        },
        async updateRelatedTelemetryForFocusedImage() {
            if (!this.relatedTelemetry.hasRelatedTelemetry || !this.focusedImage) {
                return;
            }

            // set data ON image telemetry as well as in focusedImageRelatedTelemetry
            for (let key of this.relatedTelemetry.keys) {
                if (
                    this.relatedTelemetry[key]
                    && this.relatedTelemetry[key].historical
                    && this.relatedTelemetry[key].requestLatestFor

                ) {
                    let valuesOnTelemetry = this.relatedTelemetry[key].hasTelemetryOnDatum;
                    let value = await this.getMostRecentRelatedTelemetry(key, this.focusedImage);

                    if (!valuesOnTelemetry) {
                        this.$set(this.imageHistory[this.focusedImageIndex], key, value); // manually add to telemetry
                    }

                    this.$set(this.focusedImageRelatedTelemetry, key, value);
                }
            }
        },
        trackLatestRelatedTelemetry() {
            [...this.spacecraftPositionKeys, ...this.spacecraftOrientationKeys, ...this.cameraKeys, ...this.sunKeys].forEach(key => {
                if (this.relatedTelemetry[key] && this.relatedTelemetry[key].subscribe) {
                    this.relatedTelemetry[key].subscribe((datum) => {
                        let valueKey = this.relatedTelemetry[key].realtime.valueKey;
                        this.$set(this.latestRelatedTelemetry, key, datum[valueKey]);
                    });
                }
            });
        },
        focusElement() {
            this.$el.focus();
        },
        handleKeyDown(event) {
            if (event.key === 'Alt') {
                this.altPressed = true;
            }
        },
        handleKeyUp(event) {
            if (event.key === 'Alt') {
                this.altPressed = false;
            }
        },
        handleScroll() {
            const thumbsWrapper = this.$refs.thumbsWrapper;
            if (!thumbsWrapper || this.resizingWindow) {
                return;
            }

            const { scrollLeft, scrollWidth, clientWidth } = thumbsWrapper;
            const disableScroll = scrollWidth > Math.ceil(scrollLeft + clientWidth);
            this.autoScroll = !disableScroll;
        },
        paused(state, type) {
            this.isPaused = state;

            if (type === 'button') {
                this.setFocusedImage(this.imageHistory.length - 1);
            }

            if (this.nextImageIndex) {
                this.setFocusedImage(this.nextImageIndex);
                delete this.nextImageIndex;
            }

            this.autoScroll = true;
            this.scrollToRight();
        },
        scrollToFocused() {
            const thumbsWrapper = this.$refs.thumbsWrapper;
            if (!thumbsWrapper) {
                return;
            }

            let domThumb = thumbsWrapper.children[this.focusedImageIndex];

            if (domThumb) {
                domThumb.scrollIntoView({
                    behavior: 'smooth',
                    block: 'center'
                });
            }
        },
        scrollToRight(type) {
            if (type !== 'reset' && (this.isPaused || !this.$refs.thumbsWrapper || !this.autoScroll)) {
                return;
            }

            const scrollWidth = this.$refs.thumbsWrapper.scrollWidth || 0;
            if (!scrollWidth) {
                return;
            }

            this.$nextTick(() => {
                this.$refs.thumbsWrapper.scrollLeft = scrollWidth;
            });
        },
        setFocusedImage(index, thumbnailClick = false) {
            if (thumbnailClick) {
                //We use the props till the user changes what they want to see
                this.initFocusedImageIndex = undefined;
            }

            if (this.isPaused && !thumbnailClick && this.initFocusedImageIndex === undefined) {
                this.nextImageIndex = index;
                //this could happen if bounds changes
                if (this.focusedImageIndex > this.imageHistory.length - 1) {
                    this.focusedImageIndex = index;
                }

                return;
            }

            this.focusedImageIndex = index;

            if (thumbnailClick && !this.isPaused) {
                this.paused(true);
            }
        },
        trackDuration() {
            if (this.canTrackDuration) {
                this.stopDurationTracking();
                this.updateDuration();
                this.durationTracker = window.setInterval(
                    this.updateDuration, DURATION_TRACK_MS
                );
            } else {
                this.stopDurationTracking();
            }
        },
        stopDurationTracking() {
            window.clearInterval(this.durationTracker);
        },
        updateDuration() {
            let currentTime = this.timeContext.clock() && this.timeContext.clock().currentValue();
            if (currentTime === undefined) {
                this.numericDuration = currentTime;
            } else {
                this.numericDuration = currentTime - this.parsedSelectedTime;
            }
        },
        resetAgeCSS() {
            this.refreshCSS = true;
            // unable to make this work with nextTick
            setTimeout(() => {
                this.refreshCSS = false;
            }, REFRESH_CSS_MS);
        },
        nextImage() {
            if (this.isNextDisabled) {
                return;
            }

            let index = this.focusedImageIndex;

            this.setFocusedImage(++index, THUMBNAIL_CLICKED);
            if (index === this.imageHistory.length - 1) {
                this.paused(false);
            }
        },
        prevImage() {
            if (this.isPrevDisabled) {
                return;
            }

            let index = this.focusedImageIndex;

            if (index === this.imageHistory.length - 1) {
                this.setFocusedImage(this.imageHistory.length - 2, THUMBNAIL_CLICKED);
            } else {
                this.setFocusedImage(--index, THUMBNAIL_CLICKED);
            }
        },
        resetImage(overrideLock) {
            if (this.panZoomLocked && !overrideLock) {
                return false;
            }

            const defaultScale = 1;
            this.zoomFactor = defaultScale;
            this.imagePanned = false;
            this.panZoomLocked = false;
            this.imageTranslateX = 0;
            this.imageTranslateY = 0;
        },
        zoomImage(newScaleFactor, screenClientX, screenClientY) {
            this.paused(true);
            if (newScaleFactor > ZOOM_LIMITS_MAX_DEFAULT) {
                newScaleFactor = ZOOM_LIMITS_MAX_DEFAULT;

                return;
            }

            if (newScaleFactor <= 0 || newScaleFactor < ZOOM_LIMITS_MIN_DEFAULT) {
                return this.resetImage(true);
            }

            if (!(screenClientX || screenClientY)) {
                return this.updatePanZoom(newScaleFactor, 0, 0);
            }

            // handle mouse events
            const imageRect = this.focusedImageWrapper.getBoundingClientRect();
            const imageContainerX = screenClientX - imageRect.left;
            const imageContainerY = screenClientY - imageRect.top;
            const offsetFromCenterX = (imageRect.width / 2) - imageContainerX;
            const offsetFromCenterY = (imageRect.height / 2) - imageContainerY;
            // const scaleProportion = (scale - previousZoomFactor) / previousZoomFactor;

            this.updatePanZoom(newScaleFactor, offsetFromCenterX, offsetFromCenterY);
        },
        updatePanZoom(newScaleFactor, offsetFromCenterX, offsetFromCenterY) {
            const currentScale = this.zoomFactor;
            const previousTranslateX = this.imageTranslateX;
            const previousTranslateY = this.imageTranslateY;

            const offsetXInOriginalScale = offsetFromCenterX / currentScale;
            const offsetYInOriginalScale = offsetFromCenterY / currentScale;
            const translateX = offsetXInOriginalScale + previousTranslateX;
            const translateY = offsetYInOriginalScale + previousTranslateY;
            // const imageRect = this.focusedImageWrapper.getBoundingClientRect();
            // const borderBuffer = 0;
            // this.imageTranslateX = (Math.abs(translateX) > (imageRect.width * borderBuffer)) ? Math.sign(translateX) * imageRect.width * borderBuffer : translateX;
            // this.imageTranslateY = (Math.abs(translateY) > (imageRect.height * borderBuffer)) ? Math.sign(translateY) * imageRect.height * borderBuffer : translateY;
            this.imageTranslateX = translateX;
            this.imageTranslateY = translateY;
            this.zoomFactor = newScaleFactor;
        },
        // handleGesture(e) {
        //     e.preventDefault()
        //     if (e.scale < 1) {
        //         console.log('zoom out')
        //     } else if (e.scale > 1) {
        //         console.log('zoom in')
        //     }
        // },
        handleZoomButton(stepValue) {
            this.incrementZoomFactor(stepValue);
        },
        lockPanZoomPosition() {
            if (!this.panZoomLocked && this.zoomFactor === 1) {
                return;
            }

            this.panZoomLocked = !this.panZoomLocked;
        },
        // handlePanButton(x, y) {
        //     const currentScale = this.zoomFactor;
        //     this.updatePanZoom(currentScale, x, y);
        // },
        handlePanZoomClick(e) {
            const step = 1;
            if (e.altKey) {
                return this.startPan(e);
            }

            const newZoomFactor = this.zoomFactor + step;
            console.assert(e.pageX === e.clientX, 'pageX = clientX');
            console.assert(e.pageY === e.clientY, 'pageY = clientY');

            this.zoomImage(newZoomFactor, e.clientX, e.clientY);
        },
        startDrag(e) {
            e.preventDefault();
            e.stopPropagation();
        },
        arrowDownHandler(event) {
            let key = event.keyCode;

            if (this.isLeftOrRightArrowKey(key)) {
                this.arrowDown = true;
                window.clearTimeout(this.arrowDownDelayTimeout);
                this.arrowDownDelayTimeout = window.setTimeout(() => {
                    this.arrowKeyScroll(this.directionByKey(key));
                }, ARROW_DOWN_DELAY_CHECK_MS);
            }
        },
        arrowUpHandler(event) {
            let key = event.keyCode;

            window.clearTimeout(this.arrowDownDelayTimeout);

            if (this.isLeftOrRightArrowKey(key)) {
                this.arrowDown = false;
                let direction = this.directionByKey(key);
                this[direction + 'Image']();
            }
        },
        arrowKeyScroll(direction) {
            if (this.arrowDown) {
                this.arrowKeyScrolling = true;
                this[direction + 'Image']();
                setTimeout(() => {
                    this.arrowKeyScroll(direction);
                }, ARROW_SCROLL_RATE_MS);
            } else {
                window.clearTimeout(this.arrowDownDelayTimeout);
                this.arrowKeyScrolling = false;
                this.scrollToFocused();
            }
        },
        directionByKey(keyCode) {
            let direction;

            if (keyCode === ARROW_LEFT) {
                direction = 'prev';
            }

            if (keyCode === ARROW_RIGHT) {
                direction = 'next';
            }

            return direction;
        },
        isLeftOrRightArrowKey(keyCode) {
            return [ARROW_RIGHT, ARROW_LEFT].includes(keyCode);
        },
        getImageNaturalDimensions() {
            this.focusedImageNaturalAspectRatio = undefined;

            const img = this.$refs.focusedImage;
            if (!img) {
                return;
            }

            // TODO - should probably cache this
            img.addEventListener('load', () => {
                this.focusedImageNaturalAspectRatio = img.naturalWidth / img.naturalHeight;
            }, { once: true });
        },
        resizeImageContainer() {
            if (!this.$refs.imageBG) {
                return;
            }

            if (this.$refs.imageBG.clientWidth !== this.imageContainerWidth) {
                this.imageContainerWidth = this.$refs.imageBG.clientWidth;
            }

            if (this.$refs.imageBG.clientHeight !== this.imageContainerHeight) {
                this.imageContainerHeight = this.$refs.imageBG.clientHeight;
            }
        },
        handleThumbWindowResizeStart() {
            if (!this.autoScroll) {
                return;
            }

            // To hide resume button while scrolling
            this.resizingWindow = true;
            this.handleThumbWindowResizeEnded();
        },
        handleThumbWindowResizeEnded() {
            if (!this.isPaused) {
                this.scrollToRight('reset');
            }

            this.$nextTick(() => {
                this.resizingWindow = false;
            });
        },
        // used to increment the zoom without knowledge of current level
        incrementZoomFactor(increment, userCoordX, userCoordY) {
            const newFactor = this.zoomFactor + increment;
            this.zoomImage(newFactor, userCoordX, userCoordY);
        },
        // debounced method
        clearWheelZoom() {
            this.wheelZooming = false;
        },
        wheelZoom(e) {
            e.preventDefault();
            this.paused(true);
            // only use x,y coordinates on scrolling in
            if (this.wheelZooming === false && e.deltaY > 0) {
                this.wheelZooming = true;

                // grab first x,y coordinates
                this.incrementZoomFactor(e.deltaY * 0.01, e.clientX, e.clientY);
            } else {
                // ignore subsequent event x,y so scroll drift doesn't occur
                this.incrementZoomFactor(e.deltaY * 0.01);
            }

            // debounced method that will only fire after the scroll series is complete
            this.clearWheelZoom();
        },
        startPan(e) {
            e.preventDefault();

            if (!this.pan && this.zoomFactor > 1) {
                this.animateZoom = false;
                this.imagePanned = true;
                this.pan = {
                    x: e.clientX,
                    y: e.clientY
                };
                this.listenTo(window, 'mouseup', this.onMouseUp, this);
                this.listenTo(window, 'mousemove', this.trackMousePosition, this);
            }

            return false;
        },
        trackMousePosition(e) {
            if (!e.altKey) {
                return this.onMouseUp(e);
            }

            this.updatePan(e);
            e.preventDefault();

        },
        updatePan(e) {
            if (!this.pan) {
                return;
            }

            const dX = e.clientX - this.pan.x;
            const dY = e.clientY - this.pan.y;
            this.pan = {
                x: e.clientX,
                y: e.clientY
            };
            this.updatePanZoom(this.zoomFactor, dX, dY);
        },
        endPan() {
            this.pan = undefined;
            this.animateZoom = true;
        },
        onMouseUp(event) {
            console.log('onMouseUp');
            this.stopListening(window, 'mouseup', this.onMouseUp, this);
            this.stopListening(window, 'mousemove', this.trackMousePosition, this);

            if (this.pan) {
                return this.endPan(event);
            }

            // if (this.marquee) {
            //     this.endMarquee(event);
            // }
        }

        // createImage(imageUrl) {
        //     return new Promise (function (resolve, reject) {
        //         if (!imageUrl) {
        //             return reject('No image url provided');
        //         }

        //         let loadingImage = new Image();
        //         loadingImage.onload = () => resolve(loadingImage);
        //         loadingImage.src = imageUrl;
        //     });
        // },
        // clearCanvas() {
        //     console.log('clear canvas');
        //     this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
        // },

        // drawMarquee() {
        //     this.context.beginPath();
        //     this.context.fillStyle = 'rgba(255,255,255,0.4)';
        //     this.context.lineWidth = 1;
        //     this.context.fillRect(50, 5, 100, 100);
        //     this.context.stroke();
        // },
        // drawImage(image, centerX, centerY, zoomFactor = 10) {
        //     const canvas = this.canvas;
        //     this.context.imageSmoothingEnabled = false;

        //     console.log('drawImage canvas',canvas)
        //     const positionX = centerX || canvas.width / 2;
        //     const positionY = centerY || canvas.height / 2;
        //     const width = canvas.width + (zoomFactor * (canvas.width / canvas.height));
        //     const height = canvas.height + zoomFactor;
        //     const params = {
        //         dx: 0 - (positionX / canvas.width) * (width - canvas.width),
        //         dy: 0 - (positionY / canvas.height) * (height - canvas.height),
        //         dWidth: canvas.width + (zoomFactor * (canvas.width / canvas.height)),
        //         dHeight: canvas.height + zoomFactor
        //     };
        //     console.log(params, this.sizedImageDimensions)
        //     const {dx, dy, dWidth, dHeight} = params;

        //     this.context.drawImage(image, dx, dy, dWidth, dHeight);
        //     // this.context.drawImage(image, 0, 10, 1000, 1500, 0 - 150, 0 - 130, 800, 400);

        // },

        // async drawCanvas(imageUrl) {
        //     this.clearCanvas();
        //     const focusedImage = await this.createImage(imageUrl);
        //     this.drawImage(focusedImage);
        //     // this.drawMarquee()
        //     // this.context.stroke();
        //     // focusedImage.addEventListener('load',, false);
        //     // this.context.beginPath();
        //     // this.context.drawImage(focusedImage, 250, 250);
        //     // this.context.stroke();
        //     // console.log({canvas: this.context, img})
        // },
        // onMouseDown(event) {
        //     console.log('mousedown');
        //     // do not monitor drag events on browser context click
        //     if (event.ctrlKey) {
        //         return;
        //     }

        //     this.listenTo(window, 'mouseup', this.onMouseUp, this);
        //     this.listenTo(window, 'mousemove', this.trackMousePosition, this);
        //     if (event.altKey) {
        //         return this.startPan(event);
        //     } else {
        //         return this.startMarquee(event);
        //     }

        // },
        //     this.updateMarquee();
        //     // this.updatePan();
        //     event.preventDefault();

        // },
        // marquee handlers
        // startMarquee(event) {
        //     console.log('startMarquee')
        //     this.canvas.classList.remove('plot-drag');
        //     this.canvas.classList.add('plot-marquee');

        //     this.trackMousePosition(event);
        //     // if (this.positionOverPlot) {
        //         // this.freeze();
        //         this.marquee = {
        //             startPixels: this.positionOverElement,
        //             endPixels: this.positionOverElement,
        //             start: this.positionOverPlot,
        //             end: this.positionOverPlot,
        //             color: [1, 1, 1, 0.5]
        //         };
        //         this.rectangles.push(this.marquee);
        //         this.trackHistory();
        //     // }
        // },
        // endMarquee() {
        //     const startPixels = this.marquee.startPixels;
        //     const endPixels = this.marquee.endPixels;
        //     console.log('endMarquee', {startPixels, endPixels})
        //     const marqueeDistance = Math.sqrt(
        //         Math.pow(startPixels.x - endPixels.x, 2)
        //     + Math.pow(startPixels.y - endPixels.y, 2)
        //     );
        //     // Don't zoom if mouse moved less than 7.5 pixels.
        //     if (marqueeDistance > 7.5) {
        //         // this.config.xAxis.set('displayRange', {
        //         //     min: Math.min(this.marquee.start.x, this.marquee.end.x),
        //         //     max: Math.max(this.marquee.start.x, this.marquee.end.x)
        //         // });
        //         // this.config.yAxis.set('displayRange', {
        //         //     min: Math.min(this.marquee.start.y, this.marquee.end.y),
        //         //     max: Math.max(this.marquee.start.y, this.marquee.end.y)
        //         // });
        //         // this.userViewportChangeEnd();
        //         console.log('time to do something')
        //     } else {
        //         // A history entry is created by startMarquee, need to remove
        //         // if marquee zoom doesn't occur.
        //         this.plotHistory.pop();
        //     }

        //     this.rectangles = [];
        //     this.marquee = undefined;
        // },
        // updateMarquee() {
        //     // console.log('update marquee')
        //     if (!this.marquee) {
        //         return;
        //     }

        //     this.marquee.end = this.positionOverPlot;
        //     this.marquee.endPixels = this.positionOverElement;
        // },

    }
};
</script>
