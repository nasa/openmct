<template>
    <div class="c-splitter" :class="{
    'c-splitter-vertical' : align === 'vertical',
    'c-splitter-horizontal' : align === 'horizontal',
    'c-splitter-collapse-left' : collapse === 'to-left',
    'c-splitter-collapse-right' : collapse === 'to-right',
    }">
        <a class="c-splitter__btn"></a>
    </div>
</template>

<style lang="scss">
    @import "~styles/constants";
    @import "~styles/constants-snow";
    @import "~styles/mixins";
    @import "~styles/glyphs";

    $c: #06f;
    $size: $splitterHandleD;
    $margin: 0px;
    $hitMargin: 4px;


    .c-splitter {
        background: $colorSplitterBg;
        transition: $transOut;

        &:before {
            // Bigger hit area
            //@include test();
            content: '';
            display: block;
            position: absolute;
            z-index: 1;
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

        &-vertical {
            cursor: col-resize;
            width: $size;
            margin: 0 $margin;
            &:before {
                top: 0;
                right: $hitMargin * -1;
                bottom: 0;
                left: $hitMargin * -1;
            }
        }

        &-horizontal {
            cursor: row-resize;
            height: $size;
            margin: $margin 0;
            &:before {
                top: $hitMargin * -1;
                right: 0;
                bottom: $hitMargin * -1;
                left: 0;
            }
        }
    }

    .c-splitter__btn {
        // Collapse button
        background: $colorSplitterBg;
        display: none; // Only display if splitter is collapsible, see below
        width: $splitterD;
        height: 40px;
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

        [class*="collapse"] & {
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

        [class*="collapse-left"] & {
            border-bottom-left-radius: $controlCr;
            right: 0;
            &:before {
                content: $glyph-icon-arrow-left;
            }
        }

        [class*="collapse-right"] & {
            border-bottom-right-radius: $controlCr;
            left: 0;
            &:before {
                content: $glyph-icon-arrow-right;
            }
        }
    }
</style>

<script>
    export default {
        props: {
            align: String,
            collapse: String
        }
    }
</script>