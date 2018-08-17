<template>
    <div class="l-pane"
         :class="{
             'l-pane--horizontal': type === 'horizontal',
             'l-pane--vertical': type === 'vertical',
             'l-pane--collapsed': collapsed
         }">

        <div v-if="handle"
             class="l-pane__resize-handle"
             :class="{
                  'l-pane__resize-handle--before': handle === 'before',
                  'l-pane__resize-handle--after': handle === 'after'
              }"
             @mousedown="start">
            <a class="l-pane__collapse-button"
               @click="toggleCollapse"
               v-if="collapsable"></a>
        </div>
        <div class="l-pane__contents">
            <slot></slot>
        </div>
    </div>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    $hitMargin: 4px;

    // TODO: get handles visible when pane is collapsed


    /**************************** BASE STYLES */
    .l-pane {
        /************************ PANES */
        &--horizontal {
            // Pane adjusts size horizontally, handles run vertically
            // Selectors here

            > .l-pane__resize-handle {
                //background: red;
                cursor: col-resize;
                width: $splitterHandleD;
                top: 0;
                bottom: 0;

                &:before {
                    // Extended hit area
                    top: 0;
                    right: $hitMargin * -1;
                    bottom: 0;
                    left: $hitMargin * -1;
                }

                &--before {
                    // Handle at left edge of containing pane
                    left: 0;

                    [class*="collapse-button"] {
                        left: 0;
                        transform: scaleX(-1);
                    }
                }

                &--after {
                    // Handle at right edge of containing pane
                    right: 0;

                    [class*="collapse-button"] {
                        right: 0;
                    }
                }
            }

            [class*="collapse-button"] {
                border-bottom-left-radius: $controlCr;
                height: nth($splitterCollapseBtnD, 2);
                width: nth($splitterCollapseBtnD, 1);

                &:before {
                    content: $glyph-icon-arrow-left;
                }
            }

            &.l-pane--collapsed {
                padding-left: 0 !important;
                padding-right: 0 !important;
                width: 0px;
                min-width: 0px;

                > .l-pane__resize-handle {
                    &--before {
                        transform: translateX($splitterHandleD * -1) scaleX(-1);
                    }

                    &--after {
                        transform: translateX($splitterHandleD) scaleX(-1);
                    }
                }
            }
        }

        &--vertical {
            // Pane adjusts size vertically, handles run horizontally
            // Selectors here

            > .l-pane__resize-handle {
                //background: green;
                cursor: row-resize;
                height: $splitterHandleD;
                left: 0;
                right: 0;

                &:before {
                    top: $hitMargin * -1;
                    right: 0;
                    bottom: $hitMargin * -1;
                    left: 0;
                }

                &--before {
                    // Handle at top edge of containing pane
                    top: 0;
                }

                &--after {
                    // Handle at bottom edge of containing pane
                    bottom: 0;
                }
            }

            [class*="collapse-button"] {
                height: nth($splitterCollapseBtnD, 1);
                width: nth($splitterCollapseBtnD, 2);
            }

            &.l-pane--collapsed {
                padding-top: 0 !important;
                padding-bottom: 0 !important;
                height: 0px;
                min-height: 0px;
            }
        }

        /************************ HANDLES */
        &__resize-handle {
            // Selectors for handle in any context
            z-index: 1;
            display: block;
            background: $colorSplitterBg;
            position: absolute;
            transition: $transOut;

            &:before {
                // Extended hit area
                content: '';
                display: block;
                position: absolute;
                z-index: -1;
            }

            &:active, &:hover {
                transition: $transIn;
            }

            &:active {
                background: $colorSplitterActive; // Not really working with drag
            }

            &:hover {
                background: $colorSplitterHover;
            }
        }

        /************************ COLLAPSE BUTTONS */
        &__collapse-button {
            display: flex;
            align-items: center;
            justify-content: center;
            position: absolute;
            z-index: 3;
            background: $colorSplitterButtonBg;
            transition: $transOut;

            &:active, &:hover {
                transition: $transIn;
            }

            &:hover {
                background: $colorSplitterHover;
            }

            &:active {
                background: $colorSplitterActive;
            }

            &:before {
                color: $colorSplitterFg;
                display: block;
                font-size: 0.7em;
                font-family: symbolsfont;
            }
        }

        /************************ CONTENTS */
        &__contents {
            display: contents;
        }

        /************************ COLLAPSED STATE */
        &--collapsed {
            .l-pane__contents {
                display: none;
            }
        }
    }
</style>


<script>
export default {
    props: {
        handle: {
            type: String,
            validator: function (value) {
                return ['before', 'after'].indexOf(value) !== -1;
            }
        },
        collapsable: Boolean
    },
    data() {
        return {
            collapsed: false
        }
    },
    beforeMount() {
        this.type = this.$parent.type;
        if (this.type === 'horizontal') {
            this.styleProp = 'width';
        } else {
            this.styleProp = 'height';
        }
    },
    methods: {
        toggleCollapse: function () {
            this.collapsed = !this.collapsed;
            if (this.collapsed) {
                this.currentSize = this.$el.style[this.styleProp];
                this.$el.style[this.styleProp] = '';
            } else {
                this.$el.style[this.styleProp] = this.currentSize;
                delete this.currentSize;
            }
        },
        trackSize: function() {
            if (this.type === 'vertical') {
                this.initial = this.$el.offsetHeight;
            } else if (this.type === 'horizontal') {
                this.initial = this.$el.offsetWidth;
            }
        },
        getPosition: function (event) {
            return this.type === 'horizontal' ?
                event.pageX :
                event.pageY;
        },
        getNewSize: function (event) {
            let delta = this.startPosition - this.getPosition(event);
            if (this.handle === "before") {
                return `${this.initial + delta}px`;
            }
            if (this.handle === "after") {
                return `${this.initial - delta}px`;
            }
        },
        updatePosition: function (event) {
            let size = this.getNewSize(event);
            this.$el.style[this.styleProp] = size;
        },
        start: function (event) {
            this.startPosition = this.getPosition(event);
            this.trackSize();
            document.body.addEventListener('mousemove', this.updatePosition);
            document.body.addEventListener('mouseup', this.end);
        },
        end: function (event) {
            document.body.removeEventListener('mousemove', this.updatePosition);
            document.body.removeEventListener('mouseup', this.end);
            this.trackSize();
        }
    }
}
</script>
