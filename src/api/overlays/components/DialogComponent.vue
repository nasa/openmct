<template>
    <div class="c-message">
        <!--Uses flex-row -->
        <div class="c-message__icon"
             :class="['u-icon-bg-color-' + iconClass]"></div>
        <div class="c-message__text">
            <!-- Uses flex-column -->
            <div class="c-message__title"
                 v-if="title">
                {{title}}
            </div>

            <div class="c-message__hint"
                 v-if="hint">
                {{hint}}
                <span v-if="timestamp">[{{timestamp}}]</span>
            </div>

            <div class="c-message__action-text"
                 v-if="message">
                {{message}}
            </div>
        </div>
    </div>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    .c-message {
        display: flex;
        align-items: center;
        padding: $interiorMarginLg;

        > * + * {
            margin-left: $interiorMarginLg;
        }

        &__icon {
            // Holds a background SVG graphic
            $s: 50px;
            flex: 0 0 auto;
            min-width: $s;
            min-height: $s;
        }

        &__text {
            display: flex;
            flex-direction: column;
            flex: 1 1 auto;

            > * + * {
                margin-top: $interiorMargin;
            }
        }

        // __text elements
        &__title,
        &__action-text {
            font-size: 1.2em; // TEMP

        }
    }
</style>

<script>
export default {
    inject:['iconClass', 'title', 'hint', 'timestamp', 'message']
}
</script>
