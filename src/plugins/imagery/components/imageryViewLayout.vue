<template>
    <multipane class="c-imagery-layout" type="vertical">
        <pane :style="{'min-height': `300px`}">
            <div class="main-image-wrapper c-imagery has-local-controls">
                <div class="h-local-controls h-local-controls--overlay-content c-local-controls--show-on-hover l-flex-row c-imagery__lc">
                    <span class="holder flex-elem grows c-imagery__lc__sliders">
                        <input class="icon-brightness" type="range"
                                min="0"
                                max="500"
                                v-model="filters.brightness" />
                        <input class="icon-contrast" type="range"
                                min="0"
                                max="500"
                                v-model="filters.contrast" />
                    </span>
                    <span class="holder flex-elem t-reset-btn-holder c-imagery__lc__reset-btn">
                        <a class="s-icon-button icon-reset t-btn-reset" 
                                @click="filters={brightness: 100, contrast: 100}"></a>
                    </span>
                </div>

                <div class="main-image s-image-main"
                        :class="{'paused unnsynced': paused(),'stale':false }"
                        :style="{'background-image': `url(${getImageUrl()})`,
                            'filter': `brightness(${filters.brightness}%) contrast(${filters.contrast}%)`}">
                </div>

                <div class="l-image-controller flex-elem l-flex-row">
                    <div class="l-datetime-w flex-elem grows">
                        <a class="c-button show-thumbs sm hidden icon-thumbs-strip" />
                        <span class="l-time">{{getTime()}}</span>
                    </div>
                    <div class="h-local-controls flex-elem">
                        <a class="c-button icon-pause pause-play"
                                @click="paused(!paused())"
                                :class="{'is-paused': paused()}" />
                    </div>
                </div>
            </div>
        </pane>

        <pane class="c-inspector__elements" handle="before"
                :style="{'min-height': `100px`}">
            <div class="c-elements-pool">
                <div class="thumbs-layout" ref="thumbsWrapper"
                        @scroll="handleScroll">
                    <div class="l-image-thumb-item"
                            :class="{selected: image.selected}"
                            v-for="(image, index) in imageHistory"
                            :key="index"
                            @click="setSelectedImage(image)">
                        <img class="l-thumb" v-bind:src="getImageUrl(image)">
                        <div class="l-time">{{getTime(image)}}</div>
                    </div>
                </div>
            </div>
        </pane>
    </multipane>
</template>

<style lang="scss">
    @import '~styles/sass-base';

    .c-imagery-layout {
        display: flex;
        flex-direction: column;
        overflow: auto;

        .main-image-wrapper {
            display: flex;
            flex-direction: column;
            height: 100%;
            padding-bottom: 5px;
        }

        .main-image {
            background-position: center;
            background-repeat: no-repeat;
            background-size: contain;
            height: 100%;

            &.unnsynced{
                @include sUnsynced();
            }
        }

        .l-image-controller {
            padding: 5px 0 0 0;
        }

        .thumbs-layout {
            margin-top: 5px;
            overflow: auto;
        }
    }
</style>

<script>
import multipane from '@/ui/layout/multipane.vue';
import pane from '@/ui/layout/pane.vue';
import _ from 'lodash';

export default {
    inject: ['openmct', 'domainObject'],
    components: {
        multipane,
        pane,
    },
    data() {
        return {
            autoScroll: true,
            clipped: false,
            date: '',
            elementHeight: this.getElSize(),
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
            timeFormat: '',
        }
    },
    methods: {
        datumMatchesMostRecent (datum) {
            if (this.imageHistory.length !== 0) {
                var datumTime = this.timeFormat.format(datum);
                var datumURL = this.imageFormat.format(datum);
                var lastHistoryTime = this.timeFormat.format(this.imageHistory.slice(-1)[0]);
                var lastHistoryURL = this.imageFormat.format(this.imageHistory.slice(-1)[0]);

                return datumTime === lastHistoryTime && datumURL === lastHistoryURL;
            }
            return false;
        },
        getImageUrl (datum) {
            return datum ?
                this.imageFormat.format(datum) :
                this.imageUrl;
        },
        getTime (datum) {
            return datum ?
                this.timeFormat.format(datum) :
                this.time;
        },
        handleScroll () {
            const thumbsWrapper = this.$refs.thumbsWrapper
            if (!thumbsWrapper) {
                return;
            }

            const { scrollLeft, scrollWidth, clientWidth, scrollTop, scrollHeight, clientHeight } = thumbsWrapper;
            const disableScroll = (scrollWidth - scrollLeft) > 2 * clientWidth
                    || (scrollHeight - scrollTop) > 2 * clientHeight;
            this.autoScroll = !disableScroll;
        },
        paused (state) {
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
        requestHistory (bounds) {
            this.requestCount++;
            this.imageHistory = [];
            var requestId = this.requestCount;
            this.openmct.telemetry
                .request(this.domainObject, bounds)
                .then(function (values) {
                    if (this.requestCount > requestId) {
                        return Promise.resolve('Stale request');
                    }

                    values.forEach(function (datum) {
                        this.updateHistory(datum);
                    }, this);

                    this.updateValues(values[values.length - 1]);
                }.bind(this));
        },
        scrollToBottom () {
            if (this.isPaused || !this.$refs.thumbsWrapper || !this.autoScroll) {
                return;
            }

            const scrollHeight = this.$refs.thumbsWrapper.scrollHeight || 0;
            if (!scrollHeight) {
                return;
            }

            setTimeout(() => this.$refs.thumbsWrapper.scrollTop = scrollHeight, 0);
        },
        setSelectedImage (image) {
            this.imageUrl = this.getImageUrl(image);
            this.time = this.getTime(image);
            this.paused(true);
            this.unselectAllImages();
            image.selected = true;
        },
        getElSize () {
            if (!this.$el) {
                return;
            }

            this.elementHeight = this.$el.parentElement.offsetHeight;
            return this.elementHeight;
        },
        stopListening () {
            if (this.unsubscribe) {
                this.unsubscribe();
                delete this.unsubscribe;
            }
        },
        subscribe (domainObject) {
            this.date = ''
            this.imageUrl = '';
            this.openmct.objects.get(this.keystring)
                .then(function (object) {
                    var metadata = this.openmct
                        .telemetry
                        .getMetadata(this.domainObject);
                    this.timeKey = this.openmct.time.timeSystem().key;
                    this.timeFormat = this.openmct
                        .telemetry
                        .getValueFormatter(metadata.value(this.timeKey));
                    this.imageFormat = this.openmct
                        .telemetry
                        .getValueFormatter(metadata.valuesForHints(['image'])[0]);
                    this.unsubscribe = this.openmct.telemetry
                        .subscribe(this.domainObject, function (datum) {
                            this.updateHistory(datum);
                            this.updateValues(datum);
                        }.bind(this));

                    this.requestHistory(this.openmct.time.bounds());
                }.bind(this));
        },
        unselectAllImages () {
            this.imageHistory.forEach(image => image.selected = false);
        },
        updateHistory (datum) {
            if (this.datumMatchesMostRecent(datum)) {
                return false;
            };
            var index = _.sortedIndex(this.imageHistory, datum, this.timeFormat.format.bind(this.timeFormat));
            this.imageHistory.splice(index, 0, datum);

            return true;
        },
        updateValues (datum) {
            if (this.isPaused) {
                this.nextDatum = datum;
                return;
            }

            this.time = this.timeFormat.format(datum);
            this.imageUrl = this.imageFormat.format(datum);
        },
    },
    mounted() {
        this.keystring = this.openmct.objects.makeKeyString(this.domainObject.identifier);

        this.subscribe(this.domainObject);
        this.getElSize();
        window.addEventListener('resize', this.getElSize);
    },
    updated() {
        this.scrollToBottom();
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.getElSize);
        this.stopListening();
    }
}
</script>