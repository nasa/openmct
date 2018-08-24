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

    // TODO: integrate approach at https://codepen.io/charlesh88/pen/KxpvOP

    $hitMargin: 2px;
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
            //display: none;
            opacity: 1;
            overflow: hidden;
            pointer-events: inherit;
            transition: opacity 250ms ease 250ms;
            height: 100%;
        }

        /************************ COLLAPSED STATE */
        &--collapsed {
            flex-basis: 0px;
            min-width: 0px !important;
            min-height: 0px !important;
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
                background: $colorSplitterBg;
                display: block;
                position: absolute;
                z-index: 20;

                &:before {
                    content: '';
                    display: block;
                    position: absolute;
                    z-index: -1;
                }
            }

            &__collapse-button {
                background: $colorSplitterButtonBg;
                color: $colorSplitterButtonFg;

                &:before {
                    content: $glyph-icon-arrow-right;
                    font-family: symbolsfont;
                    font-size: .5rem;
                }
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


                &[class*="--collapsed"] {
                    > .l-pane__handle {
                        //background: $colorSplitterButtonBg;
                        //width: nth($splitterCollapseBtnD, 1) + 1;
                    }

                    > .l-pane__collapse-button {
                        bottom: 0; height: auto;
                        border-radius: unset;

                        &:before {
                            transform: scaleX(-1);
                        }
                    }
                }

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
                    //border-bottom-right-radius: $controlCr;
                    bottom: 0;
                    height: auto; //nth($splitterCollapseBtnD, 2);
                    width: nth($splitterCollapseBtnD, 1);
                }

                /************************** Splitter Before */
                &[class*="-before"] {
                    padding-left: $splitterHorzPad;

                    > .l-pane__handle,
                    > .l-pane__collapse-button {
                        left: 0;
                        transform: translateX(floor($splitterHandleD / -2)); // Center over the pane edge
                    }

                    &[class*="--collapsed"] {
                        > .l-pane__collapse-button {
                           // transform: scaleX(-1);
                        }
                    }
                }

                /************************** Splitter After */
                &[class*="-after"] {
                    padding-right: $splitterHorzPad;

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
                           // transform: scaleX(1);
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
        this.styleProp = 'flex-basis';
/*        if (this.type === 'horizontal') {
            this.styleProp = 'width';
        } else {
            this.styleProp = 'height';
        }*/
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
