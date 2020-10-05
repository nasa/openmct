<template>
<div
    :tabindex="listenToKeys"
    class="c-imagery"
    @keyup="arrowUpHandler"
    @keydown="arrowDownHandler"
    @mouseover="listenToKeys = 0"
    @mouseleave="listenToKeys = undefined"
>
    <div class="c-imagery__main-image-wrapper has-local-controls">
        <div class="h-local-controls h-local-controls--overlay-content c-local-controls--show-on-hover l-flex-row c-imagery__lc">
            <span class="holder flex-elem grows c-imagery__lc__sliders">
                <input v-model="filters.brightness"
                       class="icon-brightness"
                       type="range"
                       min="0"
                       max="500"
                >
                <input v-model="filters.contrast"
                       class="icon-contrast"
                       type="range"
                       min="0"
                       max="500"
                >
            </span>
            <span class="holder flex-elem t-reset-btn-holder c-imagery__lc__reset-btn">
                <a class="s-icon-button icon-reset t-btn-reset"
                   @click="filters={brightness: 100, contrast: 100}"
                ></a>
            </span>
        </div>
        <div class="main-image s-image-main c-imagery__main-image has-local-controls"
             :class="{'paused unnsynced': isPaused,'stale':false }"
             :style="{'background-image': imageUrl ? `url(${imageUrl})` : 'none',
                      'filter': `brightness(${filters.brightness}%) contrast(${filters.contrast}%)`}"
        >
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
        </div>

        <div class="c-imagery__control-bar">
            <div class="c-imagery__time">
                <div class="c-imagery__timestamp">{{ time }}</div>
                <div
                    v-if="canTrackDuration"
                    :class="{'c-imagery--new': isImageNew && !refreshCSS}"
                    class="c-imagery__age icon-timer"
                >{{ formattedDuration }}</div>
            </div>
            <div class="h-local-controls flex-elem">
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
        <div v-for="(imageData, i) in imageHistory"
             :key="i"
             class="c-imagery__thumb c-thumb"
             :class="{ selected: focusedImage === imageData && isPaused }"
             @click="setFocusedImage(imageData, thumbnailClick)"
        >
            <img class="c-thumb__image"
                 :src="formatImageUrl(imageData)"
            >
            <div class="c-thumb__timestamp">{{ formatTime(imageData) }}</div>
        </div>
    </div>
</div>
</template>

<script>
import moment from 'moment';

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
    data() {
        let timeSystem = this.openmct.time.timeSystem();

        return {
            autoScroll: true,
            durationFormatter: undefined,
            filters: {
                brightness: 100,
                contrast: 100
            },
            focusedImage: undefined,
            imageHistory: [],
            thumbnailClick: THUMBNAIL_CLICKED,
            isPaused: false,
            metadata: {},
            requestCount: 0,
            timeSystem: timeSystem,
            timeFormatter: undefined,
            formattedDuration: undefined,
            refreshCSS: false,
            listenToKeys: undefined,
            index: undefined
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
            let age = this.getNumericDuration();

            return age < cutoff && !this.refreshCSS;
        },
        canTrackDuration() {
            return this.openmct.time.clock() && this.timeSystem.isUTCBased;
        },
        isNextDisabled() {
            let disabled = false;

            if (this.index === -1 || this.index === this.imageHistory.length - 1) {
                disabled = true;
            }

            return disabled;
        },
        isPrevDisabled() {
            let disabled = false;

            if (this.index === 0 || this.imageHistory.length < 2) {
                disabled = true;
            }

            return disabled;
        }
    },
    watch: {
        focusedImage() {
            this.trackDuration();
            this.resetAgeCSS();
        },
        listenToKeys(val) {
            this.$nextTick(() => {
                if (val === 0) {
                    this.$el.focus();
                } else {
                    this.$el.blur();
                }
            });
        }
    },
    mounted() {
        // listen
        this.openmct.time.on('bounds', this.boundsChange);
        this.openmct.time.on('timeSystem', this.timeSystemChange);
        this.openmct.time.on('clock', this.clockChange);

        // set
        this.metadata = this.openmct.telemetry.getMetadata(this.domainObject);
        this.durationFormatter = this.getFormatter(this.timeSystem.durationFormat || DEFAULT_DURATION_FORMATTER);
        this.imageFormatter = this.openmct.telemetry.getValueFormatter(this.metadata.valuesForHints(['image'])[0]);

        // initialize
        this.timeKey = this.timeSystem.key;
        this.timeFormatter = this.getFormatter(this.timeKey);

        // kickoff
        this.subscribe();
        this.requestHistory();
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
    },
    methods: {
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
                this.setFocusedImage(this.imageHistory[this.imageHistory.length - 1]);
            }

            if (this.nextDatum) {
                this.setFocusedImage(this.nextDatum);
                delete this.nextDatum;
            }

            this.autoScroll = true;
        },
        scrollToFocused() {
            const thumbsWrapper = this.$refs.thumbsWrapper;
            if (!thumbsWrapper) {
                return;
            }

            let domThumb = thumbsWrapper.children[this.index];

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
        setFocusedImage(image, thumbnailClick = false) {
            if (!image) {
                return;
            }

            if (this.isPaused && !thumbnailClick) {
                this.nextDatum = image;

                return;
            }

            this.focusedImage = image;
            this.index = this.imageHistory.indexOf(this.focusedImage);

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
            let values = await this.openmct.telemetry
                .request(this.domainObject, bounds) || [];

            if (this.requestCount === requestId) {
                const SET_FOCUSED_BOOL = false;
                values.forEach((value) => {
                    this.updateHistory(value, SET_FOCUSED_BOOL);
                });
                this.setFocusedImage(values[values.length - 1]);
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
                        this.setFocusedImage(datum);
                    }
                });
        },
        updateHistory(datum, setFocused = true) {
            if (this.datumIsNotValid(datum)) {
                return;
            }

            this.imageHistory.push(datum);

            if (setFocused) {
                this.setFocusedImage(datum);
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
                this.setFormattedDuration();
                this.durationTracker = window.setInterval(
                    this.setFormattedDuration, DURATION_TRACK_MS
                );
            } else {
                this.stopDurationTracking();
            }
        },
        stopDurationTracking() {
            window.clearInterval(this.durationTracker);
            this.formattedDuration = undefined;
        },
        getNumericDuration() {
            let currentTime = this.openmct.time.clock().currentValue();
            let parsedSelectedTime = this.parseTime(this.focusedImage);

            return currentTime - parsedSelectedTime;
        },
        setFormattedDuration() {
            let result = 'N/A';
            let negativeAge = -1;
            let numericDuration = this.getNumericDuration();

            if (numericDuration > TWENTYFOUR_HOURS) {
                negativeAge *= (numericDuration / TWENTYFOUR_HOURS);
                result = moment.duration(negativeAge, 'days').humanize(true);
            } else if (numericDuration > EIGHT_HOURS) {
                negativeAge *= (numericDuration / ONE_HOUR);
                result = moment.duration(negativeAge, 'hours').humanize(true);
            } else if (this.durationFormatter) {
                result = this.durationFormatter.format(numericDuration);
            }

            this.formattedDuration = result;
        },
        resetAgeCSS() {
            this.refreshCSS = true;
            // unable to make this work with nextTick
            setTimeout(() => {
                this.refreshCSS = false;
            }, REFRESH_CSS_MS);
        },
        setFocusedByIndex(index) {
            this.setFocusedImage(this.imageHistory[index], THUMBNAIL_CLICKED);
        },
        nextImage() {
            let index = this.index;
            this.setFocusedByIndex(++index);
            if (index === this.imageHistory.length - 1) {
                this.paused(false);
                this.$el.focus(); // reset focus
            }
        },
        prevImage() {
            let index = this.index;
            if (index === this.imageHistory.length - 1) {
                this.setFocusedByIndex(this.imageHistory.length - 2);
            } else {
                this.setFocusedByIndex(--index);
            }

            if (this.isPrevDisabled) {
                this.$el.focus(); // reset focus
            }
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
        }
    }
};
</script>
