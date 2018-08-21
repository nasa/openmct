<template>
    <span class="c-view-control"
    :class="{
        'c-view-control--expanded' : expanded,
        'is-enabled' : enabled
    }"
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

        &.is-enabled:before {
            $s: .65;
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
            expanded:  {
                type: Boolean,
                value: false
            },
            enabled: {
                // Provided to allow the view-control to still occupy space without displaying a control icon.
                // Used as such in the tree - when a node doesn't have children, set disabled to true.
                type: Boolean,
                value: false
            }
        },
        methods: {
            toggle(event) {
                this.expanded = !this.expanded;
                this.$emit('click', event);
            }
        }
    }
</script>
