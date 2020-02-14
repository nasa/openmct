<template>
<multipane class="c-imagery"
           type="vertical"
>
    <pane :style="{'min-height': `300px`}">
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
                 :class="{'paused unnsynced': paused(),'stale':false }"
                 :style="{'background-image': `url(${getImageUrl()})`,
                          'filter': `brightness(${filters.brightness}%) contrast(${filters.contrast}%)`}"
            >
            </div>

            <div class="c-imagery__control-bar">
                <div class="c-imagery__datetime">{{ getTime() }}</div>
                <div class="h-local-controls flex-elem">
                    <a class="c-button icon-pause pause-play"
                       :class="{'is-paused': paused()}"
                       @click="paused(!paused())"
                    ></a>
                </div>
            </div>
        </div>
    </pane>

    <pane class="c-thumbs"
          handle="before"
          :style="{'min-height': `100px`}"
    >
        <div ref="thumbsWrapper"
             class="c-thumbs__wrapper"
             @scroll="handleScroll"
        >
            <div v-for="(imageData, index) in imageHistory"
                 :key="index"
                 class="l-image-thumb-item c-thumb"
                 :class="{selected: imageData.selected}"
                 @click="setSelectedImage(imageData)"
            >
                <img class="l-thumb c-thumb__image"
                     :src="getImageUrl(imageData)"
                >
                <div class="l-time c-thumb__timestamp">{{ getTime(imageData) }}</div>
            </div>
        </div>
    </pane>
</multipane>
</template>

<script>
import multipane from '@/ui/layout/multipane.vue';
import pane from '@/ui/layout/pane.vue';
import _ from 'lodash';

export default {
    inject: ['openmct', 'domainObject'],
    components: {
        multipane,
        pane
    },
    data() {
        return {
            autoScroll: true,
            date: '',
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
            requestCount: 0,
            timeFormat: ''
        }
    },
    mounted() {
        this.keystring = this.openmct.objects.makeKeyString(this.domainObject.identifier);
        this.subscribe(this.domainObject);
    },
    updated() {
        this.scrollToBottom();
    },
    beforeDestroy() {
        this.stopListening();
    },
    methods: {
        datumMatchesMostRecent(datum) {
            if (this.imageHistory.length === 0) {
                return false;
            }

            const datumTime = this.timeFormat.format(datum);
            const datumURL = this.imageFormat.format(datum);
            const lastHistoryTime = this.timeFormat.format(this.imageHistory.slice(-1)[0]);
            const lastHistoryURL = this.imageFormat.format(this.imageHistory.slice(-1)[0]);

            return (datumTime === lastHistoryTime) && (datumURL === lastHistoryURL);
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
        requestHistory(bounds) {
            this.requestCount++;
            this.imageHistory = [];
            const requestId = this.requestCount;
            this.openmct.telemetry
                .request(this.domainObject, bounds)
                .then((values = []) => {
                    if (this.requestCount > requestId) {
                        return Promise.resolve('Stale request');
                    }

                    values.forEach(this.updateHistory);
                    this.updateValues(values[values.length - 1]);
                });
        },
        scrollToBottom() {
            if (this.isPaused || !this.$refs.thumbsWrapper || !this.autoScroll) {
                return;
            }

            const scrollHeight = this.$refs.thumbsWrapper.scrollHeight || 0;
            if (!scrollHeight) {
                return;
            }

            setTimeout(() => this.$refs.thumbsWrapper.scrollTop = scrollHeight, 0);
        },
        setSelectedImage(image) {
            this.imageUrl = this.getImageUrl(image);
            this.time = this.getTime(image);
            this.paused(true);
            this.unselectAllImages();
            image.selected = true;
        },
        stopListening() {
            if (this.unsubscribe) {
                this.unsubscribe();
                delete this.unsubscribe;
            }
        },
        subscribe(domainObject) {
            this.date = ''
            this.imageUrl = '';
            this.openmct.objects.get(this.keystring)
                .then((object) => {
                    const metadata = this.openmct.telemetry.getMetadata(this.domainObject);
                    this.timeKey = this.openmct.time.timeSystem().key;
                    this.timeFormat = this.openmct.telemetry.getValueFormatter(metadata.value(this.timeKey));
                    this.imageFormat = this.openmct.telemetry.getValueFormatter(metadata.valuesForHints(['image'])[0]);
                    this.unsubscribe = this.openmct.telemetry
                        .subscribe(this.domainObject, (datum) => {
                            this.updateHistory(datum);
                            this.updateValues(datum);
                        });

                    this.requestHistory(this.openmct.time.bounds());
                });
        },
        unselectAllImages() {
            this.imageHistory.forEach(image => image.selected = false);
        },
        updateHistory(datum) {
            if (this.datumMatchesMostRecent(datum)) {
                return;
            }

            const index = _.sortedIndex(this.imageHistory, datum, this.timeFormat.format.bind(this.timeFormat));
            this.imageHistory.splice(index, 0, datum);
        },
        updateValues(datum) {
            if (this.isPaused) {
                this.nextDatum = datum;

                return;
            }

            this.time = this.timeFormat.format(datum);
            this.imageUrl = this.imageFormat.format(datum);
        }
    }
}
</script>
