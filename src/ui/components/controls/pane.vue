<template>
    <div class="pane"
         :class="{
             'pane--horizontal': type === 'horizontal',
             'pane--vertical': type === 'vertical',
             'pane--collapsed': collapsed
         }">

         <div v-if="handle"
              class="pane__resize-handle"
              :class="{
                  'pane__resize-handle--before': handle === 'before',
                  'pane__resize-handle--after': handle === 'after'
              }"
              @mousedown="start"
              >
              <a class="pane__collapse-button"
                 :class="{
                     'pane__collapse-button--before': handle === 'before',
                     'pane__collapse-button--after': handle === 'after'
                 }"
                 @click="toggleCollapse"
                 v-if="collapsable"></a>
         </div>
         <slot></slot>
    </div>
</template>

<style lang="scss">
    @import "~styles/constants";
    @import "~styles/constants-snow";
    @import "~styles/mixins";
    @import "~styles/glyphs";

    $hitMargin: 4px;

    .pane {
        & > .pane__resize-handle {
            z-index: 1;
            display: block;
            background: $colorSplitterBg;
            position: absolute;

            transition: $transOut;

            &:before {
                content: '';
            }

            &:active, &:hover {
                transition: $transIn;
            }

            &:active {
                background: $colorSplitterActive;
            }

            &:hover {
                background: $colorSplitterHover;
            }
        }

        &--horizontal {
            & > .pane__resize-handle {
                cursor: col-resize;
                width: $splitterHandleD;
                top: 0;
                bottom: 0;
                &--before {
                    left: 0;
                }
                &--after {
                    right: 0;
                }
                &:before {
                    top: 0;
                    right: $hitMargin * -1;
                    bottom: 0;
                    left: $hitMargin * -1;
                }
            }
        }

        &--vertical {
            > .pane__resize-handle {
                cursor: row-resize;
                height: $splitterHandleD;
                left: 0;
                right: 0;
                &--before {
                    top: 0
                }
                &--after {
                    bottom: 0;
                }
                &:before {
                    top: $hitMargin * -1;
                    right: 0;
                    bottom: $hitMargin * -1;
                    left: 0;
                }
            }
        }


        & > .pane__resize-handle > .pane__collapse-button {
            display: flex;
            align-items: center;
            justify-content: center;
            position: absolute;
            z-index: 3;

            background: $colorSplitterBg;
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
                font-size: 0.8em;
                font-family: symbolsfont;
            }
        }

        &--horizontal > .pane__resize-handle  > .pane__collapse-button {
            width: $splitterD;
            height: 40px;

            &--before {
                border-bottom-right-radius: $controlCr;
                left: 0;
                &:before {
                    content: $glyph-icon-arrow-right;
                }
            }
            &--after {
                border-bottom-left-radius: $controlCr;
                right: 0;
                &:before {
                    content: $glyph-icon-arrow-left;
                }
            }
        }

        &--vertical > .pane__resize-handle > .pane__collapse-button {
            /* TODO: style buttons for vertical collapse. */
        }
    }

    .pane--horizontal.pane--collapsed {
        width: 0px;
        min-width: 0px;
    }
    .pane--vertical.pane--collapsed {
        height: 0px;
        min-height: 0px;
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
        console.log('this.$parent', this.$parent, this.$parent.type);
        this.type = this.$parent.type;
    },
    mounted() {
        this.type = this.$parent.type;
        if (this.type === 'horizontal') {
            this.styleProp = 'width';
        } else {
            this.styleProp = 'height';
        }
        this.trackSize();
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
