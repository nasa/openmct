<template>
    <div class="split-pane-component has-local-controls l-image-main-wrapper l-flex-col">
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

        <!-- <div class="l-image-main s-image-main flex-elem grows"
            :class="{'paused': magery.paused(),'stale':false }">
            <div class="image-main"
                mct-background-image="imagery.getImageUrl()"
                filters="filters">
            </div>
        </div> -->
    </div>
</template>

<style lang="scss">
    @import '~styles/sass-base';
</style>

<script>
export default {
        inject: [
            'openmct'
        ],
        data() {
            return {
                filters : {
                    brightness: 100,
                    contrast: 100
                }
            }
        }
}
</script>