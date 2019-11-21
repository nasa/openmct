<template>
<div class="c-progress-bar">
    <div class="c-progress-bar__holder">
        <div
            class="c-progress-bar__bar"
            :class="{'--indeterminate': model.progressPerc === 'unknown'}"
            :style="`width: ${model.progressPerc}%;`"
        />
    </div>
    <div
        v-if="model.progressText !== undefined"
        class="c-progress-bar__text"
    >
        <span v-if="model.progressPerc > 0">{{ model.progressPerc }}% complete.</span>
        {{ model.progressText }}
    </div>
</div>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    /******************************************************** PROGRESS BAR */
    @keyframes progress {
        100% { background-position: $progressAnimW center; }
    }

    @mixin progressAnim($c1, $c2, $size) {
        $edge: 20%;
        background-image: linear-gradient(-90deg,
                $c1 0%, $c2 $edge,
                $c2 $edge, $c1 100%
        );
        background-position: 0 center;
        background-repeat: repeat-x;
        background-size: $size 100%;
    }

    .c-progress-bar {
        display: flex;
        flex-direction: column;
        width: 100%;

        > * + * {
            margin-top: $interiorMargin;
        }

        &__holder {
            background: $colorProgressBarHolder;
            box-shadow: inset rgba(black, 0.4) 0 0.25px 3px;
            flex: 1 1 auto;
            padding: 1px;
        }

        &__bar {
            @include progressAnim($colorProgressBar, lighten($colorProgressBar, 10%), $progressAnimW);
            animation: progress 1000ms linear infinite;
            min-height: $progressBarMinH;
            height: 100%;

            &.--indeterminate {
                width: 100% !important;
            }
        }
    }
</style>

<script>
export default {
    props: {
        model: {
            type: Object,
            required: true
        }
    }
}
</script>
