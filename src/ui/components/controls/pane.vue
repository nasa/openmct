<template>
    <div class="l-pane"
         :class="{
            'l-pane--horizontal-handle-before': type === 'horizontal' && handle === 'before',
            'l-pane--horizontal-handle-after': type === 'horizontal' && handle === 'after',
            'l-pane--vertical-handle-before': type === 'vertical' && handle === 'before',
            'l-pane--vertical-handle-after': type === 'vertical' && handle === 'after',
            'l-pane--collapsable' : collapsable,
            'l-pane--collapsed': collapsed,
            'l-pane--reacts': !handle,
            'l-pane--resizing': resizing === true
         }">
        <div v-if="handle"
             class="l-pane__handle"
             @mousedown="start">
        </div>
        <button v-if="label"
           class="l-pane__collapse-button"
           @click="toggleCollapse">
            <span class="l-pane__label">{{ label }}</span>
        </button>
        <div class="l-pane__contents">
            <slot></slot>
        </div>
    </div>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    /**************************** BASE - MOBILE AND DESKTOP */
    .l-multipane {
        display: flex;
        flex: 1 1 auto;

        &--horizontal,
        > .l-pane {
            flex-flow: row nowrap;
        }

        &--vertical,
        > .l-pane  {
            flex-flow: column nowrap;
        }

        &--vertical {
            height: 100%;
        }
    }

    .l-pane {
        backface-visibility: hidden;
        display: flex;
        min-width: 0px;
        min-height: 0px;
        opacity: 1;
        pointer-events: inherit;

        &__handle,
        &__label {
            // __handle and __label don't appear in mobile
            display: none;
        }

        &__collapse-button {
            position: absolute;
            display: flex;
            align-items: center;
            justify-content: center;
            top: 0; right: 0; // Default
            z-index: 1;
        }

        &--reacts {
            // This is the pane that doesn't hold the handle
            // It reacts to other panes that are able to resize
            flex: 1 1 0;
        }

        &--collapsed {
            flex-basis: 0px !important;
            transition: all 350ms ease;

            .l-pane__contents {
                transition: opacity 150ms ease;
                opacity: 0;
                pointer-events: none;

                > * {
                    min-width: 0 !important;
                    min-height: 0 !important;
                }
            }
        }

        &[class*="--horizontal"] {
            &.l-pane--collapsed {
                padding-left: 0 !important;
                padding-right: 0 !important;
            }
        }

        &[class*="--vertical"] {
            &.l-pane--collapsed {
                padding-top: 0 !important;
                padding-top: 0 !important;
            }
        }

        /************************ CONTENTS */
        &__contents {
            flex: 1 1 100%;
            opacity: 1;
            padding: $interiorMargin;
            pointer-events: inherit;
            transition: opacity 250ms ease 250ms;

            .l-pane__contents {
                // Don't pad all nested __contents
                padding: 0;
            }

            > [class*="__"] + [class*="__"] {
                // Create margin between elements in a pane
                // Doesn't match first elem, but will match all subsequent
                margin-top: $interiorMargin;
            }
        }

        /************************ DESKTOP STYLES */
        body.desktop & {
            &__handle {
                background: $colorSplitterBg;
                display: block;
                position: absolute;
                z-index: 10;
                transition: $transOut;

                &:before {
                    // Extended hit area
                    content: '';
                    display: block;
                    position: absolute;
                    z-index: -1;
                }

                &:hover {
                    background: $colorSplitterHover;
                    transition: $transIn;
                }
            }

            &__collapse-button {
                $m: 2px;
                $h: 12px;
                color: $splitterBtnColorFg;
                flex: 0 0 nth($splitterBtnD, 1);
                font-size: $h * .9;
                position: relative;
                justify-content: start;
                transition: $transOut;

                &:after {
                    // Close icon
                    background: $colorBtnBg;
                    border-radius: $smallCr;
                    color: $colorBtnFg;
                    content: $glyph-icon-arrow-right-equilateral;
                    display: block;
                    font-family: symbolsfont;
                    font-size: 6px;
                    line-height: 90%;
                    padding: 3px 15px;
                    position: absolute;
                    right: $m;
                    top: $m;
                    transition: $transOut;
                    z-index: -1;
                }

                &:hover {
                    background: rgba(black, 0.1);
                    &:after {
                        background: $splitterBtnColorHoverBg;
                        color: $splitterBtnColorHoverFg;
                        transition: $transIn;
                    }
                }
            }

            &__label {
                // Name of the pane
                @include ellipsize();
                display: block;
                padding-right: nth($splitterBtnD, 2) + $interiorMargin; // Force label to ellipsis
                text-transform: uppercase;
                transform-origin: top left;
                flex: 1 0 90%;
            }

            &--resizing {
                // User is dragging the handle and resizing a pane
                @include userSelectNone();

                + .l-pane {
                    @include userSelectNone();
                }
            }

            &[class*="--collapsed"] {
                $d: nth($splitterBtnD, 1);
                flex-basis: $d;
                min-width: $d !important;
                min-height: $d !important;

                > .l-pane__handle {
                    display: none;
                }

                > .l-pane__collapse-button {
                    background: $splitterBtnColorFg;
                    color: $splitterBtnColorBg;

                    &:hover {
                        background: $splitterBtnColorHoverBg !important;
                    }
                }
            }

            > .l-pane__collapse-button {
                height: nth($splitterBtnD, 1);
                padding: $interiorMarginSm $interiorMarginSm;
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
                        right: $splitterHandleHitMargin * -1;
                        bottom: 0;
                        left: $splitterHandleHitMargin * -1;
                    }
                }

                &[class*="--collapsed"] {
                    > .l-pane__collapse-button {
                        position: absolute;
                        top: 0; right: 0; bottom: 0; left: 0;
                        height: auto; width: 100%;

                        [class*="label"] {
                            position: absolute;
                            transform: translate($interiorMarginLg + 1, 18px) rotate(90deg);
                            top: 0;
                        }

                        &:after {
                            background: none;
                            padding: 0;
                            top: $interiorMargin;
                            left: 50%;
                            right: auto;
                            transform: translateX(-50%);
                            width: auto;
                        }
                    }
                }

                /************************** Horizontal Splitter Before */
                &[class*="-before"] {
                    > .l-pane__handle {
                        left: 0;
                        transform: translateX(floor($splitterHandleD / -2)); // Center over the pane edge
                    }

                    &[class*="--collapsed"] {
                        > .l-pane__collapse-button {
                            &:after {
                                transform: translateX(-50%) scaleX(-1);
                            }
                        }
                    }
                }

                /************************** Horizontal Splitter After */
                &[class*="-after"] {
                    > .l-pane__handle {
                        right: 0;
                        transform: translateX(floor($splitterHandleD / 2));
                    }

                    &:not([class*="--collapsed"]) {
                        > .l-pane__collapse-button:after {
                            transform: scaleX(-1);
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
                        top: $splitterHandleHitMargin * -1;
                        right: 0;
                        bottom: $splitterHandleHitMargin * -1;
                    }
                }

                /************************** Vertical Splitter Before */
                // Pane collapses downward
                &[class*="-before"] {
                    > .l-pane__handle {
                        top: 0;
                        transform: translateY(floor($splitterHandleD / -1));
                    }

                    > .l-pane__collapse-button:after {
                        content: $glyph-icon-arrow-down;
                    }

                    &.l-pane--collapsed {
                        > .l-pane__collapse-button:after {
                            transform: scaleY(-1);
                        }
                    }
                }

                /************************** Vertical Splitter After */
                // Pane collapses upward. Not sure we'll ever use this...
                &[class*="-after"] {
                    > .l-pane__handle {
                        bottom: 0;
                        transform: translateY(floor($splitterHandleD / 1));
                    }

                    &:not(.l-pane--collapsed) > .l-pane__collapse-button {
                        &:after {
                            transform: scaleY(-1);
                        }
                    }
                }
            }
        } // Ends .body.desktop
    } // Ends .l-pane
</style>

<script>
const COLLAPSE_THRESHOLD_PX = 40;

export default {
    props: {
        handle: {
            type: String,
            validator: function (value) {
                return ['before', 'after'].indexOf(value) !== -1;
            }
        },
        collapsable: {
            type: Boolean,
            default: false
        },
        label: String,
        resizing: Boolean
    },
    data() {
        return {
            collapsed: false
        }
    },
    beforeMount() {
        this.type = this.$parent.type;
        this.styleProp = (this.type === 'horizontal') ? 'width' : 'height'
    },
    methods: {
        toggleCollapse: function () {
            this.collapsed = !this.collapsed;
            if (this.collapsed) {
                // Pane is expanded and is being collapsed
                this.currentSize = (this.dragCollapse === true)? this.initial : this.$el.style[this.styleProp];
                this.$el.style[this.styleProp] = '';
            } else {
                // Pane is collapsed and is being expanded
                this.$el.style[this.styleProp] = this.currentSize;
                delete this.currentSize;
                delete this.dragCollapse;
            }
        },
        trackSize: function() {
            if (!this.dragCollapse === true) {
                if (this.type === 'vertical') {
                    this.initial = this.$el.offsetHeight;
                } else if (this.type === 'horizontal') {
                    this.initial = this.$el.offsetWidth;
                }
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
            let intSize = parseInt(size.substr(0, size.length - 2));
            if (intSize < COLLAPSE_THRESHOLD_PX && this.collapsable === true) {
                this.dragCollapse = true;
                this.end();
                this.toggleCollapse();
            } else {
                this.$el.style[this.styleProp] = size;
            }
        },
        start: function (event) {
            this.startPosition = this.getPosition(event);
            document.body.addEventListener('mousemove', this.updatePosition);
            document.body.addEventListener('mouseup', this.end);
            this.resizing = true;
            this.trackSize();
        },
        end: function (event) {
            document.body.removeEventListener('mousemove', this.updatePosition);
            document.body.removeEventListener('mouseup', this.end);
            this.resizing = false;
            this.trackSize();
        }
    }
}
</script>
