<template>
    <div class="c-splitter" :class="{
    'c-splitter-vertical' : align === 'vertical',
    'c-splitter-horizontal' : align === 'horizontal'
    }"></div>
</template>

<style lang="scss">
    @import "~styles/constants";
    @import "~styles/constants-snow";

    .c-splitter {
        $c: #06f;
        $size: $splitterHandleD;
        $margin: 0px;
        $hitMargin: 7px;

        background: $colorSplitterBg;

        &:before {
            // Bigger hit area
            content: '';
            display: block;
            position: absolute;
            z-index: 2;
        }

        &:hover {
            background: $colorSplitterHover;
        }

        &-vertical {
            cursor: col-resize;
            width: $size;
            margin: 0 $margin;
            &:before {
                top: 0; right: $hitMargin * -1; bottom: 0; left: $hitMargin * -1;
            }
        }

        &-horizontal {
            cursor: row-resize;
            height: $size;
            margin: $margin 0;
            &:before {
                top: $hitMargin * -1; right: 0; bottom: $hitMargin * -1; left: 0;
            }
        }
    }
</style>

<script>
    export default {
        props: {
            align: String
        }
    }
</script>