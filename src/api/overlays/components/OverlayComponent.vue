<template>
    <div class="c-overlay">
        <div class="c-overlay__blocker"
            @click="destroy">
        </div>
        <div class="c-overlay__outer">
            <button class="c-click-icon c-overlay__close-button icon-x-in-circle"
                v-if="dismissable"
                @click="destroy">
            </button>
            <div class="c-overlay__contents" ref="element"></div>
            <div class="c-overlay__button-bar" v-if="buttons">
                <button class="c-button"
                        v-for="(button, index) in buttons"
                        :key="index"
                        :class="{'c-button--major': button.emphasis}"
                        @click="buttonClickHandler(button.callback)">
                    {{button.label}}
                </button>
            </div>
        </div>
    </div>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    @mixin overlaySizing($marginTB: 5%, $marginLR: $marginTB, $width: auto, $height: auto) {
        position: absolute;
        top: $marginTB; right: $marginLR; bottom: $marginTB; left: $marginLR;
        width: $width;
        height: $height;
    }

    .l-overlay-wrapper {
        // Created by overlayService.js, contains this template.
        // Acts as an anchor for one or more overlays.
        display: contents;
    }

    .c-overlay {
        @include abs();
        z-index: 70;

        &__blocker {
            display: none; // Mobile-first
        }

        &__outer {
            @include abs();
            background: $overlayColorBg;
            color: $overlayColorFg;
            display: flex;
            flex-direction: column;
            padding: $overlayInnerMargin;
        }

        &__close-button {
            $p: $interiorMargin;
            border-radius: 100% !important;
            color: $overlayColorFg;
            display: inline-block;
            font-size: 1.25em;
            position: absolute;
            top: $p; right: $p;
        }

        &__contents {
            flex: 1 1 auto;
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        &__top-bar {
            flex: 0 0 auto;
            flex-direction: column;
            display: flex;

            > * {
                flex: 0 0 auto;
                margin-bottom: $interiorMargin;
            }
        }

        &__dialog-title {
            @include ellipsize();
            font-size: 1.5em;
            line-height: 120%;
        }

        &__contents-main {
            display: flex;
            flex-direction: column;
            flex: 1 1 auto;
            height: 0; // Chrome 73 overflow bug fix
            overflow: auto;
            padding-right: $interiorMargin; // fend off scroll bar
        }

        &__button-bar {
            flex: 0 0 auto;
            display: flex;
            justify-content: flex-end;
            margin-top: $interiorMargin;

            > * + * {
                margin-left: $interiorMargin;
            }
        }

        .c-button,
        .c-click-icon {
            filter: $overlayBrightnessAdjust;
        }
    }

    body.desktop {
        .c-overlay {
            &__blocker {
                @include abs();
                background: $colorOvrBlocker;
                cursor: pointer;
                display: block;
            }
        }

        // Overlay types, styling for desktop. Appended to .l-overlay-wrapper element.
        .l-overlay-large,
        .l-overlay-small,
        .l-overlay-fit {
            .c-overlay__outer {
                border-radius: $overlayCr;
                box-shadow: rgba(black, 0.5) 0 2px 25px;
            }
        }
        
        .l-overlay-fullscreen {
            // Used by About > Licenses display
            .c-overlay__outer {
                @include overlaySizing($overlayOuterMarginFullscreen);
            }
        }

        .l-overlay-large {
            // Default
            .c-overlay__outer {
                @include overlaySizing($overlayOuterMarginLg);
            }
        }

        .l-overlay-small {
            .c-overlay__outer {
                @include overlaySizing($overlayOuterMarginDialog);
            }
        }

        .t-dialog-sm .l-overlay-small, // Legacy dialog support
        .l-overlay-fit {
            .c-overlay__outer {
                @include overlaySizing(auto);
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
                min-width: 20%;
            }
        }
    }

</style>

<script>
    export default {
        inject: ['dismiss', 'element', 'buttons', 'dismissable'],
        mounted() {
            this.$refs.element.appendChild(this.element);
        },
        methods: {
            destroy: function () {
                if (this.dismissable) {
                    this.dismiss();
                }
            },
            buttonClickHandler: function (method) {
                method();
                this.$emit('destroy');
            }
        }
    }
</script>
