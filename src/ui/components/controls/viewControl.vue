<template>
    <span class="c-view-control"
    :class="{ 'c-view-control--expanded' : expanded }"
    @click="toggle"></span>
</template>

<style lang="scss">
    @import "~styles/sass-base";;

    .c-view-control {
        $d: 12px;
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 0 0 auto;
        width: $d;
        position: relative;

        &:before {
            $s: .75;
            content: $glyph-icon-arrow-right-equilateral;
            display: block;
            font-family: symbolsfont;
            font-size: 1rem * $s;
            position: absolute;
            transform-origin: floor(($d / 2) * $s); // This is slightly better than 'center'
            transition: transform 100ms ease-in-out;
        }

        &--expanded {
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
        },
        methods: {
            toggle() {
                this.expanded = !this.expanded;
            }
        }
    }
</script>
