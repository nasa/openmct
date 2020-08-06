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
        <div class="main-image s-image-main c-imagery__main-image has-local-controls"
             :class="{'paused unnsynced': paused(),'stale':false }"
             :style="{'background-image': getImageUrl() ? `url(${getImageUrl()})` : 'none',
                      'filter': `brightness(${filters.brightness}%) contrast(${filters.contrast}%)`}"
        >
            <div class="c-local-controls c-local-controls--show-on-hover c-imagery__prev-next-buttons">
                <button class="c-nav c-nav--prev"
                        title="Previous image"
                        :disabled="isDisabled('prev')"
                        @click="arrowClick('prev')"
                ></button>
                <button class="c-nav c-nav--next"
                        title="Next image"
                        :disabled="isDisabled('next')"
                        @click="arrowClick('next')"
                ></button>
            </div>
        </div>

        <div class="c-imagery__control-bar">
            <div class="c-imagery__timestamp">{{ getTime() }}</div>
            <div class="h-local-controls flex-elem">
                <a
                    class="c-button icon-pause pause-play"
                    :class="{'is-paused': paused()}"
                    @click="paused(!paused())"
                ></a>
            </div>
        </div>
    </div>
    <div ref="thumbsWrapper"
         class="c-imagery__thumbs-wrapper"
         :class="{'is-paused': paused()}"
         @scroll="handleScroll"
    >
        <div v-for="(imageData, index) in imageHistory"
             :key="index"
             class="c-imagery__thumb c-thumb"
             :class="{selected: imageData.selected}"
             @click="setSelectedImage(imageData)"
        >
            <img class="c-thumb__image"
                 :src="getImageUrl(imageData)"
            >
            <div class="c-thumb__timestamp">{{ getTime(imageData) }}</div>
        </div>
    </div>
</div>
</template>

<script>
import _ from 'lodash';

export default {
    inject: ['openmct', 'domainObject'],
    data() {
        return {
            autoScroll: true,
            filters : {
                brightness: 100,
                contrast: 100
            },
            image: {
                selected: ''
            },
            imageFormat: '',
            imageHistory: [],
            imageUrl: '',
            isPaused: false,
            metadata: {},
            requestCount: 0,
            timeFormat: ''
        }
    },
    mounted() {
        // set
        this.keystring = this.openmct.objects.makeKeyString(this.domainObject.identifier);
        this.metadata = this.openmct.telemetry.getMetadata(this.domainObject);
        this.imageFormat = this.openmct.telemetry.getValueFormatter(this.metadata.valuesForHints(['image'])[0]);
        // initialize
        this.timeKey = this.openmct.time.timeSystem().key;
        this.timeFormat = this.openmct.telemetry.getValueFormatter(this.metadata.value(this.timeKey));
        // listen
        this.openmct.time.on('bounds', this.boundsChange);
        this.openmct.time.on('timeSystem', this.timeSystemChange);
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
        this.openmct.time.off('bounds', this.boundsChange);
        this.openmct.time.off('timeSystem', this.timeSystemChange);
    },
    methods: {
        datumIsNotValid(datum) {
            if (this.imageHistory.length === 0) {
                return false;
            }

            const datumTime = this.timeFormat.format(datum);
            const datumURL = this.imageFormat.format(datum);
            const lastHistoryTime = this.timeFormat.format(this.imageHistory.slice(-1)[0]);
            const lastHistoryURL = this.imageFormat.format(this.imageHistory.slice(-1)[0]);

            // datum is not valid if it matches the last datum in history,
            // or it is before the last datum in the history
            const datumTimeCheck = this.timeFormat.parse(datum);
            const historyTimeCheck = this.timeFormat.parse(this.imageHistory.slice(-1)[0]);
            const matchesLast = (datumTime === lastHistoryTime) && (datumURL === lastHistoryURL);
            const isStale = datumTimeCheck < historyTimeCheck;

            return matchesLast || isStale;
        },
        getImageUrl(datum) {
            return datum ?
                this.imageFormat.format(datum) :
                this.imageUrl;
        },
        getTime(datum) {
            return datum ?
                this.timeFormat.format(datum) :
                this.time;
        },
        handleScroll() {
            const thumbsWrapper = this.$refs.thumbsWrapper
            if (!thumbsWrapper) {
                return;
            }

            const { scrollLeft, scrollWidth, clientWidth, scrollTop, scrollHeight, clientHeight } = thumbsWrapper;
            const disableScroll = (scrollWidth - scrollLeft) > 2 * clientWidth
                    || (scrollHeight - scrollTop) > 2 * clientHeight;
            this.autoScroll = !disableScroll;
        },
        paused(state) {
            if (arguments.length > 0 && state !== this.isPaused) {
                this.unselectAllImages();
                this.isPaused = state;
                if (state === true) {
                    // If we are pausing, select the latest image in imageHistory
                    this.setSelectedImage(this.imageHistory[this.imageHistory.length - 1]);
                }

                if (this.nextDatum) {
                    this.updateValues(this.nextDatum);
                    delete this.nextDatum;
                } else {
                    this.updateValues(this.imageHistory[this.imageHistory.length - 1]);
                }

                this.autoScroll = true;
            }

            return this.isPaused;
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
        setSelectedImage(image) {
            // If we are paused and the current image IS selected, unpause
            // Otherwise, set current image and pause
            if (!image) {
                return;
            }

            if (this.isPaused && image.selected) {
                this.paused(false);
                this.unselectAllImages();
            } else {
                this.imageUrl = this.getImageUrl(image);
                this.time = this.getTime(image);
                this.paused(true);
                this.unselectAllImages();
                image.selected = true;
            }
        },
        boundsChange(bounds, isTick) {
            if (!isTick) {
                this.requestHistory();
            }
        },
        requestHistory() {
            let bounds = this.openmct.time.bounds();
            this.requestCount++;
            const requestId = this.requestCount;
            this.imageHistory = [];
            this.openmct.telemetry
                .request(this.domainObject, bounds)
                .then((values = []) => {
                    if (this.requestCount === requestId) {
                        values.forEach(this.updateHistory, false);
                        this.updateValues(values[values.length - 1]);
                    }
                });
        },
        timeSystemChange(system) {
            // reset timesystem dependent variables
            this.timeKey = system.key;
            this.timeFormat = this.openmct.telemetry.getValueFormatter(this.metadata.value(this.timeKey));
        },
        subscribe() {
            this.unsubscribe = this.openmct.telemetry
                .subscribe(this.domainObject, (datum) => {
                    let parsedTimestamp = this.timeFormat.parse(datum[this.timeKey]),
                        bounds = this.openmct.time.bounds();

                    if(parsedTimestamp >= bounds.start && parsedTimestamp <= bounds.end) {
                        this.updateHistory(datum);
                        this.updateValues(datum);
                    }
                });
        },
        unselectAllImages() {
            this.imageHistory.forEach(image => image.selected = false);
        },
        updateHistory(datum, updateValues = true) {
            if (this.datumIsNotValid(datum)) {
                return;
            }

            const index = _.sortedIndexBy(this.imageHistory, datum, this.timeFormat.format.bind(this.timeFormat));
            this.imageHistory.splice(index, 0, datum);

            if(updateValues) {
                this.updateValues(datum);
            }
        },
        updateValues(datum) {
            if (this.isPaused) {
                this.nextDatum = datum;

                return;
            }

            this.time = this.timeFormat.format(datum);
            this.imageUrl = this.imageFormat.format(datum);
        },
        arrowClick(type) {
            console.log('arrow click', type);  
        },
        isDisabled(type) {
            return false;
        }
    }
}
</script>
