<template>
<div class="c-message">
    <!--Uses flex-row -->
    <div
        class="c-message__icon"
        :class="['u-icon-bg-color-' + iconClass]"
    ></div>
    <div class="c-message__text">
        <!-- Uses flex-column -->
        <div
            v-if="title"
            class="c-message__title"
        >
            {{ title }}
        </div>

        <div
            v-if="hint"
            class="c-message__hint"
        >
            {{ hint }}
            <span v-if="timestamp">[{{ timestamp }}]</span>
        </div>

        <div
            v-if="message"
            class="c-message__action-text"
        >
            {{ message }}
        </div>
        <slot></slot>
    </div>
</div>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    @mixin legacyMessage() {
        flex: 0 1 auto;
        font-family: symbolsfont;
        font-size: $messageIconD; // Singleton message in a dialog
        margin-right: $interiorMarginLg;
    }

    .c-message {
        display: flex;
        align-items: center;

        > * + * {
            margin-left: $interiorMarginLg;
        }

        &__icon {
            // Holds a background SVG graphic
            $s: 80px;
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
        &__action-text {
            font-size: 1.2em;
        }

        &__title {
            font-size: 1.5em;
            font-weight: bold;
        }

        &--simple {
            // Icon and text elements only
            &:before {
                font-size: 30px !important;
            }

            [class*='__text'] {
                font-size: 1.25em;
            }
        }

        /************************** LEGACY */
        &.message-severity-info:before {
            @include legacyMessage();
            content: $glyph-icon-info;
            color: $colorInfo;
        }

        &.message-severity-alert:before {
            @include legacyMessage();
            content: $glyph-icon-alert-rect;
            color: $colorWarningLo;
        }

        &.message-severity-error:before {
            @include legacyMessage();
            content: $glyph-icon-alert-triangle;
            color: $colorWarningHi;
        }

        // Messages in a list
        .c-overlay__messages & {
            padding: $interiorMarginLg;
            &:before {
                font-size: $messageListIconD;
            }
        }
    }
</style>

<script>
export default {
    inject:['iconClass', 'title', 'hint', 'timestamp', 'message']
}
</script>
