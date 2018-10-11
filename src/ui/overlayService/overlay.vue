<template>
    <div class="c-overlay">
        <div class="c-overlay__blocker"
             v-on:click="destroy">
        </div>
        <div class="c-overlay__outer">
            <button class="c-click-icon c-overlay__close-button icon-x-in-circle"
                v-on:click="destroy">
            </button>
            <div class="c-overlay__contents" ref="element"></div>
            <div class="c-overlay__button-bar" v-if="!buttons">
                <button class="c-button c-button--major"
                        v-on:click="destroy">
                    Done
                </button>
            </div>
            <div class="c-overlay__button-bar" v-if="buttons">
                <button class="c-button c-button--major"
                        v-for="(button, index) in buttons"
                        :key="index"
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
        z-index: 100;

        &__blocker {
            display: none; // Mobile-first
        }

        &__outer {
            @include abs();
            background: $colorOvrBg;
            color: $colorOvrFg;
            display: flex;
            flex-direction: column;
            padding: $overlayInnerMargin;
        }

        &__close-button {
            $p: $interiorMarginSm;
            border-radius: 100%;
            display: inline-block;
            position: absolute;
            top: $p; right: $p;
        }

        &__contents {
            flex: 1 1 auto;
            overflow: auto;
        }

        &__button-bar {
            flex: 0 0 auto;
            display: flex;
            justify-content: flex-end;
            margin-top: $interiorMargin;
        }


        // Overlay types, styling independent of platform.
        .l-large-view & {
            // Default
        }

        .l-dialog & {
            //
        }

        .l-message & {
            &__outer {
             //   background: orange;
            }
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

            &__outer {
                border-radius: $overlayCr;
                box-shadow: rgba(black, 0.5) 0 2px 25px;
                // Defaults to l-large-view
                @include overlaySizing($overlayOuterMarginLg);
            }
        }

        // Overlay types, styling for desktop.
        .l-large-view {
            // Default
        }

        .l-dialog {
            .c-overlay__outer {
                @include overlaySizing($overlayOuterMarginDialog);
            }
        }

        .l-message {
            .c-overlay__outer {
                @include overlaySizing(auto);
                top: 50%;
                left: 50%;
                transform: translate(-50%, -50%);
            }
        }


    }

</style>

<script>
    export default {
        inject: ['destroy', 'element', 'buttons'],
        mounted() {
            this.$refs.element.appendChild(this.element);
        },
        methods: {
            buttonClickHandler: function (method) {
                method();
                this.destroy();
            }
        }
    }
</script>
