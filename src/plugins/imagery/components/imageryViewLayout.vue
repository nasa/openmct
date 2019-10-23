<template>
    <div class="imagery-layout"
            :class="{'unnsynced': paused() }">
        <div class="c-imagery has-local-controls">
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

            <div class="s-image-main"
                    :class="{'paused': paused(),'stale':false }">
                <div class="main-image"
                    :style="{'height': `${getMainImageSize()}px`,
                        'background-image': `url(${getImageUrl()})`,
                        'filter': `brightness(${filters.brightness}%) contrast(${filters.contrast}%)`}">
                </div>
            </div>
        </div>
        <div class="image-thumbs-wrapper" ref="thumbsWrapper">
            <resize-handle
                    :index="0"
                    :isEditing=true
                    :orientation="'vertical'"
                    @init-move="startContainerResizing"
                    @move="containerResizing"
                    @end-move="endContainerResizing">
            </resize-handle>
            <div class="l-image-main-controlbar flex-elem l-flex-row">
                <div class="l-datetime-w flex-elem grows">
                    <a class="c-button show-thumbs sm hidden icon-thumbs-strip"
                            @click="showThumbsBubble = !showThumbsBubble" />
                    <span class="l-time">{{getTime()}}</span>
                </div>
                <div class="h-local-controls flex-elem">
                    <a class="c-button icon-pause pause-play"
                            @click="paused(!paused())"
                            :class="{'is-paused': paused()}" />
                </div>
            </div>
            <div class="thumbs-layout"
                    :style="[{'height': thumbsHeight + 'px'}]">
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
    </div>
</template>

<style lang="scss">
    @import '~styles/sass-base';

    .imagery-layout {
        display: flex;
        flex-direction: column;

        &.unnsynced{
            @include sUnsynced();
        }
        .main-image {
            background-position: center;
            background-repeat: no-repeat;
            background-size: contain;
            height: 100px;
            width: 100%;
        }

        .image-thumbs-wrapper {
            display: table;
        }

        .thumbs-layout {
            display: flex;
            flex-wrap: wrap;
            overflow: auto;
        }
    }
</style>

<script>
import ResizeHandle from  '../../flexibleLayout/components/resizeHandle.vue';
import _ from 'lodash';

export default {
    inject: ['openmct', 'domainObject'],
    components: {
        ResizeHandle
    },
    data() {
        return {
            autoScroll: this.openmct.time.clock(),
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
            lockMove: true,
            thumbsHeight: 200,
            requestCount: 0,
            showThumbsBubble: true,
            timeFormat: '',
        }
    },
    props: {

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
            if (this.autoScroll) {
                this.scrollable[0].scrollTop = this.scrollable[0].scrollHeight;
            }
        },
        setSelectedImage (image) {
            this.imageUrl = this.getImageUrl(image);
            this.time = this.getTime(image);
            this.paused(true);
            this.unselectAllImages();
            image.selected = true;
        },
        startContainerResizing(index) {
            this.lockMove = false;
        },
        containerResizing(index, delta, event) {
            if (this.lockMove) {
                return;
            }
            _.debounce(() => {
                let percentageMoved = Math.round(delta / this.getElSize() * 100);
                this.thumbsHeight = this.thumbsHeight - percentageMoved;
            }, 0)(index, delta, event);
        },
        getMainImageSize () {
            const totalHeight = this.getElSize();
            if (!totalHeight) {
                return;
            }
            return this.getElSize() - this.$refs.thumbsWrapper.offsetHeight - 10;
        },
        getElSize () {
            if (!this.$el) {
                return;
            }

            this.elementHeight = this.$el.parentElement.offsetHeight;
            return this.elementHeight;
        },
        endContainerResizing(event) {
            this.lockMove = true;
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
         window.addEventListener('resize', this.getElSize);
    },
    beforeDestroy() {
        window.removeEventListener('resize', this.getElSize);
        this.stopListening();
    }
}
</script>