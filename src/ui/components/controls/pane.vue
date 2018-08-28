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
           v-if="collapsable">
            <span class="l-pane__label">{{ label }}</span>
        </a>
        <div class="l-pane__contents">
            <slot></slot>
        </div>
    </div>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    $hitMargin: 2px;
    /**************************** BASE - MOBILE AND DESKTOP */
    .l-pane {
        opacity: 1;
        pointer-events: inherit;
        transition: transOut;

        &__handle,
        &__label {
            // __handle and __label don't appear in mobile
            display: none;
        }

        &__collapse-button {
            // Mobile-first
            position: absolute;
            display: flex;
            align-items: center;
            justify-content: center;
            top: 0; right: 0; // Default
            z-index: 1;
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
            opacity: 1;
            padding: $interiorMargin;
            pointer-events: inherit;
            transition: opacity 250ms ease 250ms;
            height: 100%;
        }

        /************************ COLLAPSED STATE */
        &--collapsed {
            flex-basis: 0px !important;
            min-width: 0px !important;
            min-height: 0px !important;
            transition: all 350ms ease;

            .l-pane__contents {
                transition: opacity 150ms ease;
                opacity: 0;
                pointer-events: none;
            }
        }

        /************************ DESKTOP STYLES */
        body.desktop & {
            &__handle {
                background: $colorSplitterBg;
                display: block;
                position: absolute;
                z-index: 20;
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
                background: $colorSplitterButtonBg;
                color: $colorSplitterButtonFg;
                font-size: nth($splitterCollapseBtnD, 1) * .7;
                position: relative;
                justify-content: start;
                transition: $transOut;

                &:after {
                    // Close icon
                    content: $glyph-icon-x;
                    font-family: symbolsfont;
                    font-size: .8em;
                }

                &:hover {
                    background: $colorSplitterButtonHoverBg;
                    color: $colorSplitterButtonHoverFg;
                    transition: $transIn;
                }
            }

            &__label {
                // Name of the pane
                display: block;
                text-transform: uppercase;
                transform-origin: top left;
                flex: 1 0 90%;
            }

            &[class*="--collapsed"] {
                $d: nth($splitterCollapseBtnD, 1);
                flex-basis: $d;
                min-width: $d !important;
                min-height: $d !important;

                > .l-pane__handle {
                    display: none;
                }
            }

            &[class*="--horizontal"] {
                $splitterHorzPad: nth($splitterCollapseBtnD, 1) + $interiorMargin;

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
                    height: nth($splitterCollapseBtnD, 1);
                    padding: $interiorMarginSm $interiorMarginSm;
                }

                &[class*="--collapsed"] {
                    > .l-pane__collapse-button {
                        position: absolute;
                        bottom: 0; left: 0;
                        height: auto;

                        [class*="label"] {
                            position: absolute;
                            transform: translate($interiorMarginLg, 15px) rotate(90deg);
                            top: 0;
                        }

                        &:after {
                            content: $glyph-icon-plus;
                            position: absolute;
                            top: $interiorMarginSm;

                        }
                    }
                }

                /************************** Horizontal Splitter Before */
                &[class*="-before"] {
                    > .l-pane__handle {
                        left: 0;
                        transform: translateX(floor($splitterHandleD / -2)); // Center over the pane edge
                    }
                }

                /************************** Horizontal Splitter After */
                &[class*="-after"] {
                    > .l-pane__handle {
                        right: 0;
                        transform: translateX(floor($splitterHandleD / 2));
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

            }
        } // Ends .body.desktop
    } // Ends .l-pane
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
        collapsable: Boolean,
        label: String
    },
    data() {
        return {
            collapsed: false
        }
    },
    beforeMount() {
        this.type = this.$parent.type;
        this.styleProp = 'flex-basis';
    },
    methods: {
        toggleCollapse: function () {
            this.collapsed = !this.collapsed;
            // console.log("rs " + restoreSize);
            // if (!restoreSize) { restoreSize = this.$el.style[this.styleProp]; }
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
            this.$el.style[this.styleProp] = size;
            let intSize = parseInt(size.substr(0, size.length - 2));
            // console.log(this.initial);
            if (intSize < 50) {
                console.log("initial: " + this.initial);
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
            this.trackSize();
        },
        end: function (event) {
            document.body.removeEventListener('mousemove', this.updatePosition);
            document.body.removeEventListener('mouseup', this.end);
            this.trackSize();
        }
    }
}
</script>
