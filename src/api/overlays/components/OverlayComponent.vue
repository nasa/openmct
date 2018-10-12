<template>
    <div class="c-overlay">
        <div class="c-overlay__blocker"
            @click="dismiss">
        </div>
        <div class="c-overlay__outer">
            <button class="c-click-icon c-overlay__close-button icon-x-in-circle"
                @click="dismiss">
            </button>
            <div class="c-overlay__contents" ref="element"></div>
            <div class="c-overlay__button-bar" v-if="!buttons">
                <button class="c-button c-button--major"
                    @click="dismiss">
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
            background: $overlayColorBg;
            color: $overlayColorFg;
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

        body.desktop & {
            &__blocker {
                @include abs();
                background: rgba(black, 0.7);
                cursor: pointer;
                display: block;
            }

            &__outer {
                $m: $overlayOuterMargin;
                top: $m; right: $m; bottom: $m; left: $m;
                border-radius: $overlayCr;
                box-shadow: rgba(black, 0.5) 0 2px 25px;
            }
        }
    }

</style>

<script>
    export default {
        inject: ['dismiss', 'element', 'buttons'],
        mounted() {
            this.$refs.element.appendChild(this.element);
        },
        methods: {
            buttonClickHandler: function (method) {
                method();
                this.dismiss();
            }
        }
    }
</script>
