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
            <span class="c-image-controls__sliders"
                  draggable="true"
                  @dragstart="startDrag"
            >
                <div class="c-image-controls__slider-wrapper icon-brightness">
                    <input v-model="filters.brightness"
                           type="range"
                           min="0"
                           max="500"
                    >
                </div>
                <div class="c-image-controls__slider-wrapper icon-contrast">
                    <input v-model="filters.contrast"
                           type="range"
                           min="0"
                           max="500"
                    >
                </div>
            </span>
            <span class="t-reset-btn-holder c-imagery__lc__reset-btn c-image-controls__btn-reset">
                <a class="s-icon-button icon-reset t-btn-reset"
                   @click="filters={brightness: 100, contrast: 100}"
                ></a>
            </span>
        </div>
        <div class="c-imagery__main-image__bg"
             :class="{'paused unnsynced': isPaused,'stale':false }"
        >
            <div
                ref="imageContainer"
                class="c-imagery__main-image__image js-imageryView-image"
                :style="{
                    'background-image': imageUrl ? `url(${imageUrl})` : 'none',
                    'filter': `brightness(${filters.brightness}%) contrast(${filters.contrast}%)`
                }"
                :data-openmct-image-timestamp="time"
                :data-openmct-object-keystring="keyString"
            ></div>
            <!-- TODO - fix after protyping -->
            <CompassHUD />
            <!-- TODO - fix after protyping -->
            <CompassRose
                v-if="shouldDisplayCompassRose"
                :rover-heading="metadataRoverHeading"
                :sun-heading="metadataSunHeading"
                :cam-field-of-view="metadataCamFieldOfView"
            />
        </div>
        <div class="c-local-controls c-local-controls--show-on-hover c-imagery__prev-next-buttons">
            <button class="c-nav c-nav--prev"
                    title="Previous image"
                    :disabled="isPrevDisabled"
                    @click="prevImage()"
            ></button>
            <button class="c-nav c-nav--next"
                    title="Next image"
                    :disabled="isNextDisabled"
                    @click="nextImage()"
            ></button>
        </div>

        <div class="c-imagery__control-bar">
            <div class="c-imagery__time">
                <div class="c-imagery__timestamp u-style-receiver js-style-receiver">{{ time }}</div>
                <div
                    v-if="canTrackDuration"
                    :class="{'c-imagery--new': isImageNew && !refreshCSS}"
                    class="c-imagery__age icon-timer"
                >{{ formattedDuration }}</div>
            </div>
            <div class="h-local-controls">
                <button
                    class="c-button icon-pause pause-play"
                    :class="{'is-paused': isPaused}"
                    @click="paused(!isPaused, 'button')"
                ></button>
            </div>
        </div>
    </div>
    <div ref="thumbsWrapper"
         class="c-imagery__thumbs-wrapper"
         :class="{'is-paused': isPaused}"
         @scroll="handleScroll"
    >
        <div v-for="(datum, index) in imageHistory"
             :key="datum.url"
             class="c-imagery__thumb c-thumb"
             :class="{ selected: focusedImageIndex === index && isPaused }"
             @click="setFocusedImage(index, thumbnailClick)"
        >
            <img class="c-thumb__image"
                 :src="formatImageUrl(datum)"
            >
            <div class="c-thumb__timestamp">{{ formatTime(datum) }}</div>
        </div>
    </div>
</div>
</template>

<script>
import _ from 'lodash';
import moment from 'moment';
import CompassRose from './CompassRose.vue';
import CompassHUD from './CompassHUD.vue';

const DEFAULT_DURATION_FORMATTER = 'duration';
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

export default {
    inject: ['openmct', 'domainObject'],
    components: {
        CompassRose,
        CompassHUD
    },
    data() {
        let timeSystem = this.openmct.time.timeSystem();

        return {
            autoScroll: true,
            durationFormatter: undefined,
            filters: {
                brightness: 100,
                contrast: 100
            },
            imageHistory: [],
            thumbnailClick: THUMBNAIL_CLICKED,
            isPaused: false,
            metadata: {},
            requestCount: 0,
            timeSystem: timeSystem,
            timeFormatter: undefined,
            refreshCSS: false,
            keyString: undefined,
            focusedImageIndex: undefined,
            focusedImageRelatedData: {},
            numericDuration: undefined,
            metadataEndpoints: {},
            relatedTelemetry: {},
            imageContainerWidth: undefined,
            imageContainerHeight: undefined
        };
    },
    computed: {
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
            return this.openmct.time.clock() && this.timeSystem.isUTCBased;
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
        shouldDisplayCompassRose() {
            return this.focusedImage !== undefined
                && this.metadataRoverHeading !== undefined;
        },
        metadataRoverHeading() {
            return this.focusedImage && this.focusedImage['Rover Heading'];
        },
        metadataSunHeading() {
            return this.focusedImage && this.focusedImage['Sun Orientation'];
        },
        metadataCamFieldOfView() {
            return 70;
        }
    },
    watch: {
        focusedImageIndex() {
            this.trackDuration();
            this.resetAgeCSS();
            this.updateRelatedTelemetryForFocusedImage();
        },
        imageUrl() {
            if (this.imageUrl !== undefined) {
                this.getImageNaturalDimensions();
            }
        }
    },
    async mounted() {
        // listen
        this.openmct.time.on('bounds', this.boundsChange);
        this.openmct.time.on('timeSystem', this.timeSystemChange);
        this.openmct.time.on('clock', this.clockChange);

        // set
        this.keyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);
        this.metadata = this.openmct.telemetry.getMetadata(this.domainObject);
        this.imageHints = this.metadata.valuesForHints(['image'])[0];
        this.durationFormatter = this.getFormatter(this.timeSystem.durationFormat || DEFAULT_DURATION_FORMATTER);
        this.imageFormatter = this.openmct.telemetry.getValueFormatter(this.imageHints);
        this.roverKeys = ['Rover Heading', 'Rover Roll', 'Rover Yaw', 'Rover Pitch'];
        this.cameraKeys = ['Camera Pan', 'Camera Tilt'];
        this.sunKeys = ['Sun Orientation'];

        // DELETE WHEN DONE
        this.temporaryForImageEnhancements();

        // initialize
        this.timeKey = this.timeSystem.key;
        this.timeFormatter = this.getFormatter(this.timeKey);

        // kickoff
        this.subscribe();
        this.requestHistory();
        await this.initializeRelatedTelemetry();

        // for when people are scrolling through images quickly
        _.debounce(this.updateRelatedTelemetryForFocusedImage, 400);

        // examples
        // if (this.hasRelatedTelemetry) {
        //     this.relatedTelemetry['Rover Heading'].subscribe(datum => console.log(datum));
        //     console.log(await this.getMostRecentRelatedTelemetry('Rover Roll', this.imageHistory[4]));
        // }

        this.pollResizeImageContainerID = setInterval(this.pollResizeImageContainer, 200);
    },
    updated() {
        this.scrollToRight();
    },
    beforeDestroy() {
        if (this.unsubscribe) {
            this.unsubscribe();
            delete this.unsubscribe;
        }

        this.stopDurationTracking();
        this.openmct.time.off('bounds', this.boundsChange);
        this.openmct.time.off('timeSystem', this.timeSystemChange);
        this.openmct.time.off('clock', this.clockChange);

        // unsubscribe from related telemetry
        if (this.hasRelatedTelemetry) {
            for (let key of this.relatedTelemetry.keys) {
                if (this.relatedTelemetry[key].unsubscribe) {
                    this.relatedTelemetry[key].unsubscribe();
                }
            }
        }

        clearInterval(this.pollResizeImageContainerID);
    },
    methods: {
        // for local dev, to be DELETED
        temporaryForImageEnhancements() {

            this.searchService = this.openmct.$injector.get('searchService');
            this.temporaryDev = true;

            // mock related telemetry metadata
            this.imageHints.relatedTelemetry = {};

            // populate temp keys in imageHints for local testing
            [...this.roverKeys, ...this.cameraKeys, ...this.sunKeys].forEach(key => {

                this.imageHints.relatedTelemetry[key] = {
                    dev: true,
                    realtime: key,
                    historical: key,
                    valueKey: 'sin',
                    devInit: async () => {
                        const searchResults = await this.searchService.query(key);
                        const endpoint = searchResults.hits[0].id;
                        const domainObject = await this.openmct.objects.get(endpoint);

                        return domainObject;
                    }
                };
            });
        },
        async initializeRelatedTelemetry() {
            if (this.imageHints.relatedTelemetry === undefined) {
                this.hasRelatedTelemetry = false;

                return;
            }

            // DELETE
            if (this.temporaryDev) {
                let searchIndexBuildDelay = new Promise((resolve, reject) => {
                    setTimeout(resolve, 3000);
                });

                await searchIndexBuildDelay;
            }

            let keys = Object.keys(this.imageHints.relatedTelemetry);

            this.hasRelatedTelemetry = true;
            this.relatedTelemetry = {
                keys,
                ...this.imageHints.relatedTelemetry
            };

            // grab historical and subscribe to realtime
            for (let key of keys) {
                let historicalId = this.relatedTelemetry[key].historical;
                let realtimeId = this.relatedTelemetry[key].realtime;
                let sameId = false;

                if (historicalId && realtimeId && historicalId === realtimeId) {

                    // DELETE temp
                    if (this.relatedTelemetry[key].dev) {
                        this.relatedTelemetry[key].historicalDomainObject = await this.relatedTelemetry[key].devInit();
                        delete this.relatedTelemetry[key].dev;
                        delete this.relatedTelemetry[key].devInit;
                    } else {
                        this.relatedTelemetry[key].historicalDomainObject = await this.openmct.objects.get(historicalId);
                    }

                    this.relatedTelemetry[key].realtimeDomainObject = this.relatedTelemetry[key].historicalDomainObject;
                    sameId = true;
                }

                if (historicalId) {
                    // check for on-telemetry data, will need to handle things differently if this is the case
                    if (historicalId[0] === '.') {
                        this.relatedTelemetry[key].valueOnTelemetry = true;
                    }

                    if (!sameId) {
                        this.relatedTelemetry[key].historicalDomainObject = await this.openmct.objects.get(historicalId);
                    }

                    this.relatedTelemetry[key].request = async (options = {}) => {
                        let results = await this.openmct.telemetry
                            .request(this.relatedTelemetry[key].historicalDomainObject, options);

                        return results;
                    };
                }

                if (realtimeId) {

                    // set up listeners
                    this.relatedTelemetry[key].listeners = [];
                    this.relatedTelemetry[key].subscribe = async (callback) => {

                        if (!this.relatedTelemetry[key].trackingData) {
                            await this.trackDataForKey(key);
                        }

                        if (!this.relatedTelemetry[key].listeners.includes(callback)) {
                            this.relatedTelemetry[key].listeners.push(callback);

                            return () => {
                                this.relatedTelemetry[key].listeners.remove(callback);
                            };
                        } else {
                            return () => {};
                        }
                    };

                    if (!sameId) {
                        this.relatedTelemetry[key].realtimeDomainObject = await this.openmct.objects.get(realtimeId);
                    }

                }
            }

        },
        async getMostRecentRelatedTelemetry(key, targetDatum) {
            if (!this.hasRelatedTelemetry) {
                throw new Error(`${this.domainObject.name} does not have any related telemetry`);
            }

            if (!this.relatedTelemetry[key]) {
                throw new Error(`${key} does not exist on related telemetry`);
            }

            if (!this.relatedTelemetry[key].trackingData) {
                await this.trackDataForKey(key);
            }

            let mostRecentSubset = this.relatedTelemetry[key].historicalData.filter(datum => datum[this.timeKey] <= targetDatum[this.timeKey]);
            let mostRecent = mostRecentSubset.pop();

            if (this.relatedTelemetry[key].valueKey) {
                mostRecent = mostRecent[this.relatedTelemetry[key].valueKey];
            }

            return mostRecent;
        },
        async trackDataForKey(key) {
            // historical
            if (this.relatedTelemetry[key].historical) {
                this.relatedTelemetry[key].historicalData = await this.relatedTelemetry[key].request();
                this.relatedTelemetry[key].trackingHistoricalData = true;
            }

            // realtime
            if (this.relatedTelemetry[key].realtime) {
                this.relatedTelemetry[key].unsubscribe = this.openmct.telemetry.subscribe(
                    this.relatedTelemetry[key].realtimeDomainObject, datum => {
                        // store the latest relatedTelemetryKey
                        this.$set(this.relatedTelemetry[key], 'latest', datum);

                        // if any additional listeners
                        this.relatedTelemetry[key].listeners.forEach(callback => {
                            callback(datum);
                        });

                        // add to historical if applicable
                        if (this.relatedTelemetry[key].historicalData !== undefined) {
                            this.relatedTelemetry[key].historicalData.push(datum);
                        } else {
                            // store for later
                        }
                    }
                );

                this.relatedTelemetry[key].isSubscribed = true;
            }
        },
        async updateRelatedTelemetryForFocusedImage() {
            if (!this.hasRelatedTelemetry) {
                return;
            }

            const image = this.imageHistory[this.focusedImageIndex];

            for (let key of this.relatedTelemetry.keys) {
                let value = await this.getMostRecentRelatedTelemetry(key, this.focusedImage);

                image[key] = value;

                // @Jamie can remove this if you only need metadata on this.focusedImage
                this.$set(this.focusedImageRelatedData, key, value);
            }

            this.imageHistory.splice(this.focusedImageIndex, 1, image);
        },
        focusElement() {
            this.$el.focus();
        },
        datumIsNotValid(datum) {
            if (this.imageHistory.length === 0) {
                return false;
            }

            const datumURL = this.formatImageUrl(datum);
            const lastHistoryURL = this.formatImageUrl(this.imageHistory.slice(-1)[0]);

            // datum is not valid if it matches the last datum in history,
            // or it is before the last datum in the history
            const datumTimeCheck = this.parseTime(datum);
            const historyTimeCheck = this.parseTime(this.imageHistory.slice(-1)[0]);
            const matchesLast = (datumTimeCheck === historyTimeCheck) && (datumURL === lastHistoryURL);
            const isStale = datumTimeCheck < historyTimeCheck;

            return matchesLast || isStale;
        },
        formatImageUrl(datum) {
            if (!datum) {
                return;
            }

            return this.imageFormatter.format(datum);
        },
        formatTime(datum) {
            if (!datum) {
                return;
            }

            let dateTimeStr = this.timeFormatter.format(datum);

            // Replace ISO "T" with a space to allow wrapping
            return dateTimeStr.replace("T", " ");
        },
        parseTime(datum) {
            if (!datum) {
                return;
            }

            return this.timeFormatter.parse(datum);
        },
        handleScroll() {
            const thumbsWrapper = this.$refs.thumbsWrapper;
            if (!thumbsWrapper) {
                return;
            }

            const { scrollLeft, scrollWidth, clientWidth, scrollTop, scrollHeight, clientHeight } = thumbsWrapper;
            const disableScroll = (scrollWidth - scrollLeft) > 2 * clientWidth
                    || (scrollHeight - scrollTop) > 2 * clientHeight;
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
        scrollToRight() {
            if (this.isPaused || !this.$refs.thumbsWrapper || !this.autoScroll) {
                return;
            }

            const scrollWidth = this.$refs.thumbsWrapper.scrollWidth || 0;
            if (!scrollWidth) {
                return;
            }

            setTimeout(() => this.$refs.thumbsWrapper.scrollLeft = scrollWidth, 0);
        },
        setFocusedImage(index, thumbnailClick = false) {
            if (this.isPaused && !thumbnailClick) {
                this.nextImageIndex = index;

                return;
            }

            this.focusedImageIndex = index;

            if (thumbnailClick && !this.isPaused) {
                this.paused(true);
            }
        },
        boundsChange(bounds, isTick) {
            if (!isTick) {
                this.requestHistory();
            }
        },
        async requestHistory() {
            let bounds = this.openmct.time.bounds();
            this.requestCount++;
            const requestId = this.requestCount;
            this.imageHistory = [];
            let data = await this.openmct.telemetry
                .request(this.domainObject, bounds) || [];

            if (this.requestCount === requestId) {
                data.forEach((datum, index) => {
                    this.updateHistory(datum, index === data.length - 1);
                });
            }
        },
        timeSystemChange(system) {
            this.timeSystem = this.openmct.time.timeSystem();
            this.timeKey = this.timeSystem.key;
            this.timeFormatter = this.getFormatter(this.timeKey);
            this.durationFormatter = this.getFormatter(this.timeSystem.durationFormat || DEFAULT_DURATION_FORMATTER);
            this.trackDuration();
        },
        clockChange(clock) {
            this.trackDuration();
        },
        subscribe() {
            this.unsubscribe = this.openmct.telemetry
                .subscribe(this.domainObject, (datum) => {
                    let parsedTimestamp = this.parseTime(datum);
                    let bounds = this.openmct.time.bounds();

                    if (parsedTimestamp >= bounds.start && parsedTimestamp <= bounds.end) {
                        this.updateHistory(datum);
                    }
                });
        },
        updateHistory(datum, setFocused = true) {
            if (this.datumIsNotValid(datum)) {
                return;
            }

            this.imageHistory.push(datum);

            if (setFocused) {
                this.setFocusedImage(this.imageHistory.length - 1);
            }
        },
        getFormatter(key) {
            let metadataValue = this.metadata.value(key) || { format: key };
            let valueFormatter = this.openmct.telemetry.getValueFormatter(metadataValue);

            return valueFormatter;
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
            let currentTime = this.openmct.time.clock().currentValue();
            this.numericDuration = currentTime - this.parsedSelectedTime;
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
            const img = new Image();
            img.src = this.imageUrl;
            img.addEventListener('load', (data) => {
                this.focusedImageAspectRatio = img.naturalHeight / img.naturalWidth;
            }, { once: true });
        },
        pollResizeImageContainer() {
            if (this.$refs.imageContainer.clientWidth !== this.imageContainerWidth) {
                this.imageContainerWidth = this.$refs.imageContainer.clientWidth;
            }

            if (this.$refs.imageContainer.clientHeight !== this.imageContainerHeight) {
                this.imageContainerHeight = this.$refs.imageContainer.clientHeight;
            }
        }
    }
};
</script>
