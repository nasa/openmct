<template>
<div class="c-imagery__main-image-wrapper has-local-controls"
    tabindex="0"
    @keyup="arrowUpHandler"
    @keydown="arrowDownHandler"
>
    <div class="h-local-controls h-local-controls--overlay-content c-local-controls--show-on-hover c-image-controls__controls">
        <span class="c-image-controls__sliders"
              draggable="true"
              @dragstart.prevent.stop
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
               @click="filters={ brightness: 100, contrast: 100 }"
            ></a>
        </span>
    </div>

    <div class="c-imagery__main-image__bg"
         :class="{'paused unnsynced': isPaused,'stale':false }"
         @click="showLargeView()"
    >
        <div class="c-imagery__main-image__image js-imageryView-image"
             :style="{
                 'background-image': imageUrl ? `url(${imageUrl})` : 'none',
                 'filter': `brightness(${filters.brightness}%) contrast(${filters.contrast}%)`
             }"
             :data-openmct-image-timestamp="time"
             :data-openmct-object-keystring="keyString"
        ></div>
        <div class="c-local-controls c-local-controls--show-on-hover c-imagery__prev-next-buttons">
            <button class="c-nav c-nav--prev"
                    title="Previous image"
                    :disabled="isPrevDisabled"
                    @click.stop="prevImage()"
            ></button>
            <button class="c-nav c-nav--next"
                    title="Next image"
                    :disabled="isNextDisabled"
                    @click.stop="nextImage()"
            ></button>
        </div>
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
</template>

<script>
export default {
    props: {
        canTrackDuration: {
            type: Boolean,
            default: false
        },
        formattedDuration: {
            type: String,
            default: ''
        },
        imageUrl: {
            type: String,
            default: ''
        },
        isImageNew: {
            type: Boolean,
            default: false
        },
        isLargeView: {
            type: Boolean,
            default: false
        },
        isNextDisabled: {
            type: Boolean,
            default: false
        },
        isPaused: {
            type: Boolean,
            default: false
        },
        isPrevDisabled: {
            type: Boolean,
            default: false
        },
        keyString: {
            type: String,
            default: ''
        },
        refreshCSS: {
            type: Boolean,
            default: false
        },
        time: {
            type: String,
            default: ''
        }
    },
    data() {
        return {
            filters: {
                brightness: 100,
                contrast: 100
            }
        };
    },
    mounted() {
        this.$nextTick(() =>{
            this.$el.focus();
        })
    },
    methods: {
        arrowUpHandler(event) {
            if (!this.isLargeView) {
                return;
            }

            this.$emit('arrowUpHandler', event);
        },
        arrowDownHandler(event) {
            if (!this.isLargeView) {
                return;
            }

            this.$emit('arrowDownHandler', event);
        },
        nextImage() {
            this.$emit('nextImage');
        },
        paused(state, type) {
            this.$emit('paused', state, type);
        },
        prevImage() {
            this.$emit('prevImage');
        },
        showLargeView() {
            if (this.isLargeView) {
                return;
            }

            this.$emit('showLargeView');
        }
    }
};
</script>
