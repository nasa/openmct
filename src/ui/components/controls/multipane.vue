<template>
    <div class="multipane"
         :class="{
             'multipane--vertical': type === 'vertical',
             'multipane--horizontal': type === 'horizontal'
         }">
        <slot></slot>
    </div>
</template>

<style lang="scss">
.multipane {
    @import "~styles/constants";
    @import "~styles/constants-snow";
    @import "~styles/mixins";
    @import "~styles/glyphs";

    $hitMargin: 4px;

    & > .multipane__pane > .multipane__splitter {
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

    &--horizontal > .multipane__pane > .multipane__splitter {
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

    &--vertical > .multipane__pane > .multipane__splitter {
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

    /* collapsed panes */
    &--horizontal > .multipane__pane--collapsed {
        // TODO: make it fully collapse
        width: 0px;
    }

    &--vertical > .multipane__pane--collapsed {
        // TODO: make it fully collapse
        height: 0px;
    }

    /* Collapse button styling */

    & > .multipane__pane > .multipane__splitter .multipane__splitter__button {
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

        display: flex;
        align-items: center;
        justify-content: center;
        position: absolute;
        z-index: 3;
        &:before {
            color: $colorSplitterFg;
            display: block;
            font-size: 0.8em;
            font-family: symbolsfont;
        }
    }

    &--horizontal > .multipane__pane > .multipane__splitter {
        & > .multipane__splitter__button {
            width: $splitterD;
            height: 40px;
        }

        &--before .multipane__splitter__button {
            border-bottom-right-radius: $controlCr;
            left: 0;
            &:before {
                content: $glyph-icon-arrow-right;
            }
        }
        &--after .multipane__splitter__button {
            border-bottom-left-radius: $controlCr;
            right: 0;
            &:before {
                content: $glyph-icon-arrow-left;
            }
        }
    }

    &--vertical > .multipane__pane > .multipane__splitter__button {
        /* TODO: style buttons for vertical collapse. */
    }
}
</style>

<script>
export default {
    props: {
        type: {
            type: String,
            validator: function (value) {
                return ['vertical', 'horizontal'].indexOf(value) !== -1;
            }
        }
    }
}
</script>
