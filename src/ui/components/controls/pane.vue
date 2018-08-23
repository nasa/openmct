<template>
    <div class="l-pane"
         :class="{
            'l-pane--horizontal-handle-before': type === 'horizontal' && handle === 'before',
            'l-pane--horizontal-handle-after': type === 'horizontal' && handle === 'after',
            'l-pane--vertical-handle-before': type === 'vertical' && handle === 'before',
            'l-pane--vertical-handle-after': type === 'vertical' && handle === 'after',
             'l-pane--collapsed': collapsed
         }">
        <!-- TODO: move resize-handle styling from handle into pane, so that padding can be handled -->
        <div v-if="handle"
             class="l-pane__handle"
             @mousedown="start">
        </div>
        <a class="l-pane__collapse-button"
           @click="toggleCollapse"
           v-if="collapsable"></a>
        <div class="l-pane__contents">
            <slot></slot>
        </div>
    </div>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    $hitMargin: 4px;
    /**************************** BASE - MOBILE AND DESKTOP */
    .l-pane {
        opacity: 1;
        pointer-events: inherit;

        &__handle {
            // __handle doesn't appear in mobile
            display: none;
        }

        &__collapse-button {
            position: absolute;
            display: flex;
            align-items: center;
            justify-content: center;
            top: 0; right: 0; // Default
            z-index: 3;
        }

        &[class*="--horizontal"] {
            &.l-pane--collapsed {
                padding-left: 0 !important;
                padding-right: 0 !important;
                width: 0px;
                min-width: 0px;
            }
        }

        &[class*="--vertical"] {
            &.l-pane--collapsed {
                padding-top: 0 !important;
                padding-top: 0 !important;
                height: 0px;
                min-height: 0px;
            }
        }

        /************************ CONTENTS */
        &__contents {
            //display: none;
            opacity: 1;
            overflow: hidden;
            pointer-events: inherit;
            transition: opacity 250ms ease 250ms;
            height: 100%;
        }

        /************************ COLLAPSED STATE */
        &--collapsed {
            transition: all 350ms ease;

            .l-pane__contents {
                transition: opacity 150ms ease;
                opacity: 0;
                pointer-events: none;
            }
        }

        /************************ MOBILE-ONLY STYLES */


        /************************ DESKTOP STYLES */
        body.desktop & {
            //@include test(blue, 0.1);

            &__handle {
                z-index: 1;
                display: block;
                position: absolute;

                &:before {
                    content: '';
                    display: block;
                    position: absolute;
                    z-index: -1;
                }
            }

            &__collapse-button {
                background: $colorSplitterButtonBg;
                color: $colorSplitterFg;

                &:before {
                    font-size: .5rem;
                }
            }

            &[class*="--collapsed"] {
                > .l-pane__handle {
                    display: none;
                }
            }

            &[class*="--horizontal"] {
                > .l-pane__handle {
                    cursor: col-resize;
                    top: 0;
                    bottom: 0;
                    width: $splitterHandleD;

                    &:before {
                        // Extended hit area
                        top: 0;
                        right: $hitMargin * -1;
                        bottom: 0;
                        left: $hitMargin * -1;
                    }
                }

                > .l-pane__collapse-button {
                    border-bottom-right-radius: $controlCr;
                    height: nth($splitterCollapseBtnD, 2);
                    width: nth($splitterCollapseBtnD, 1);

                    &:before {
                        content: $glyph-icon-arrow-right;
                    }
                }

                /************************** Splitter Before */
                &[class*="-before"] {
                    padding-left: nth($splitterCollapseBtnD, 1) + $interiorMargin;

                    > .l-pane__handle,
                    > .l-pane__collapse-button {
                        left: 0;
                        transform: translateX(floor($splitterHandleD / -2)); // Center over the pane edge
                    }

                    > .l-pane__collapse-button {
                    }

                    &[class*="--collapsed"] {
                        > .l-pane__collapse-button {
                            transform: translateX(-100%) scaleX(-1);
                        }
                    }
                }

                /************************** Splitter After */
                &[class*="-after"] {
                    padding-right: nth($splitterCollapseBtnD, 1) + $interiorMargin;

                    > .l-pane__handle,
                    > .l-pane__collapse-button {
                        right: 0;
                        transform: translateX(floor($splitterHandleD / 2));
                    }

                    > .l-pane__collapse-button {
                        transform: scaleX(-1);
                    }

                    &[class*="--collapsed"] {
                        > .l-pane__collapse-button {
                            transform: translateX(100%) scaleX(1);
                        }
                    }
                }
            }

            &[class*="--vertical"] {
                > .l-pane__handle {
                    cursor: row-resize;
                    left: 0;
                    right: 0;
                    height: $splitterHandleD;

                    &:before {
                        // Extended hit area
                        left: 0;
                        top: $hitMargin * -1;
                        right: 0;
                        bottom: $hitMargin * -1;
                    }
                }

                > .l-pane__collapse-button {
                    width: nth($splitterCollapseBtnD, 2);
                    height: nth($splitterCollapseBtnD, 1);
                }

            }




        } // Ends .body.desktop
    } // Ends .l-pane













    .l-pane {
        /************************ PANES */
        &--horizontal {
            // Pane adjusts size horizontally, handles run vertically
            // Selectors here

            > .l-pane__handle {
               /* top: 0;
                bottom: 0;

                &--before {
                    left: 0;
                    [class*="collapse-button"] {
                        left: 0;
                    }
                }

                &--after {
                    right: 0;
                    [class*="collapse-button"] {
                        right: 0;
                    }
                }
*/

                body.desktop & {
                    cursor: col-resize;
                    width: $splitterHandleD;

                    &:before {
                        // Extended hit area
                        top: 0;
                        right: $hitMargin * -1;
                        bottom: 0;
                        left: $hitMargin * -1;
                    }

                    &:after {
                        // Grippy
                        min-height: nth($splitterGrippyD, 3);
                        height: nth($splitterGrippyD, 2);
                        width: nth($splitterGrippyD, 1);
                        top: 50%; left: ($splitterHandleD - nth($splitterGrippyD, 1)) / 2;
                        transform: translateY(-50%);
                    }

                    &--before {
                        // Handle at left edge of containing pane
                        // left: 0;

                        [class*="collapse-button"] {
                            // left: 0;
                            transform: scaleX(-1);
                        }
                    }

                    &--after {
                        // Handle at right edge of containing pane
                        // right: 0;

                        /*[class*="collapse-button"] {
                            right: 0;
                        }*/
                    }

                    [class*="collapse-button"] {
                        background: $colorSplitterGrippy;
                        color: $colorSplitterFg;
                        font-size: 0.6em;
                        height: nth($splitterCollapseBtnD, 2);
                        width: nth($splitterCollapseBtnD, 1);

                        &:before {
                            content: $glyph-icon-arrow-left;
                        }
                    }

                    &.l-pane--collapsed {
                        > .l-pane__handle {
                            &--before {
                                transform: translateX($splitterHandleD * -1) scaleX(-1);
                            }

                            &--after {
                                transform: translateX($splitterHandleD) scaleX(-1);
                            }
                        }
                    }
                }
            }



/*            &.l-pane--collapsed {
                padding-left: 0 !important;
                padding-right: 0 !important;
                width: 0px;
                min-width: 0px;
            }*/
        }

        &--vertical {
            // Pane adjusts size vertically, handles run horizontally
            // Selectors here

            > .l-pane__handle {
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

                &:after {
                    // Grippy
                    min-width: nth($splitterGrippyD, 3);
                    width: nth($splitterGrippyD, 2);
                    height: nth($splitterGrippyD, 1);
                    left: 50%; top: ($splitterHandleD - nth($splitterGrippyD, 1)) / 2;
                    transform: translateX(-50%);
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
        &__handle {
            // Selectors for handle in any context
/*            z-index: 1;
            display: block;
            position: absolute;*/


            body.desktop & {
                background: $colorSplitterBg;
                transition: $transOut;
                &:before {
                    // Extended hit area
                    content: '';
                    display: block;
                    position: absolute;
                    z-index: -1;
                }

                &:after {
                    // Grippy affordance
                    content: '';
                    background: $colorSplitterGrippy;
                    border-radius: 5px;
                    display: block;
                    position: absolute;
                    z-index: 1;
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
        }

        /************************ COLLAPSE BUTTONS */
        &__collapse-button {
            display: flex;
            align-items: center;
            justify-content: center;
            position: absolute;
            z-index: 3;

            body.desktop & {
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
            }

            &:before {
                // Glyph holder
                display: block;
                font-family: symbolsfont;
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
