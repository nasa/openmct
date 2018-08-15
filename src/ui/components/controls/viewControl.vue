<template>
    <span class="c-view-control"
    :class="{ 'c-view-control-expanded' : expanded }"></span>
</template>

<style lang="scss">
    @import "~styles/sass-base";;

    .c-view-control {
        $d: 14px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 auto;
        height: $d;
        width: $d;
        margin-right: $interiorMargin;
        position: relative;

        &:before {
            content: $glyph-icon-arrow-right-equilateral;
            display: block;
            font-family: symbolsfont;
            font-size: 0.75rem;
            position: absolute;
            transform-origin: center;
            transition: transform 100ms ease-in-out;
        }

        &-expanded {
            &:before {
                transform: rotate(90deg);
            }
        }
    }
</style>

<script>
    export default {
        props: {
            expanded: Boolean
        }
    }
</script>
