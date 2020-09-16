<template>
<div class="c-imagery">
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
        <div class="main-image s-image-main c-imagery__main-image"
             :class="{'paused unnsynced': isPaused,'stale':false }"
             :style="{'background-image': imageUrl ? `url(${imageUrl})` : 'none',
                      'filter': `brightness(${filters.brightness}%) contrast(${filters.contrast}%)`}"
        >
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
        <div v-for="(imageData, index) in imageHistory"
             :key="index"
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
const THUMBNAIL_CLICKED = true;

const ONE_MINUTE = 60 * 1000;
const FIVE_MINUTES = 5 * ONE_MINUTE;
const ONE_HOUR = ONE_MINUTE * 60;
const EIGHT_HOURS = 8 * ONE_HOUR;
const TWENTYFOUR_HOURS = EIGHT_HOURS * 3;

export default {
    inject: ['openmct', 'domainObject'],
    data() {
        let clock = this.openmct.time.clock();
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
            clock: clock,
            formattedDuration: undefined,
            refreshCSS: false
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
            return this.clock && this.timeSystem.isUTCBased;
        },
        numericDuration() {
            let currentTime = this.clock.currentValue();
            let parsedSelectedTime = this.parseTime(this.focusedImage);

            return currentTime - parsedSelectedTime;
        }
    },
    watch: {
        focusedImage() {
            this.trackDuration();
            this.resetAgeCSS();
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

            const datumTime = this.formatTime(datum);
            const datumURL = this.formatImageUrl(datum);
            const lastHistoryTime = this.formatTime(this.imageHistory.slice(-1)[0]);
            const lastHistoryURL = this.formatImageUrl(this.imageHistory.slice(-1)[0]);

            // datum is not valid if it matches the last datum in history,
            // or it is before the last datum in the history
            const datumTimeCheck = this.parseTime(datum);
            const historyTimeCheck = this.parseTime(this.imageHistory.slice(-1)[0]);
            const matchesLast = (datumTime === lastHistoryTime) && (datumURL === lastHistoryURL);
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

            return this.timeFormatter.format(datum);
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
            this.clock = clock;
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
        setFormattedDuration() {
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

            this.formattedDuration = result;
        },
        resetAgeCSS() {
            this.refreshCSS = true;
            // unable to make this work with nextTick
            setTimeout(() => {
                this.refreshCSS = false;
            }, REFRESH_CSS_MS);
        }
    }
};
</script>
