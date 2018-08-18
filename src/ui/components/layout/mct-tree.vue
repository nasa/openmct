<template>
    <ul class="c-tree">
        <tree-item v-for="node in nodes"
                   :key="node.id"
                   :node="node">
        </tree-item>
    </ul>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    .c-tree {
        overflow-x: hidden;
        overflow-y: auto;
        height: 100%;

        .c-tree {
            margin-left: 20px;
        }

        &__item {
            border-radius: $controlCr;
            color: $colorItemTreeFg;
            display: flex;
            align-items: stretch;
            cursor: pointer;
            padding: 5px;
            transition: background 150ms ease;

            &:hover {
                background: $colorItemTreeHoverBg;
                .c-tree__item__name:before {
                    // Type icon
                    color: $colorItemTreeIconHover;
                }
            }

            .c-tree__item__view-control {
                color: $colorItemTreeVC;
                margin-right: $interiorMarginSm;
            }

            &__name {
                &:before {
                    color: $colorItemTreeIcon;
                    width: $treeTypeIconW;
                }
            }
        }
    }

    .c-object-name {
        display: flex;
        align-items: center;
        overflow: hidden;
        white-space: nowrap;

        &:before {
            // Type icon
            display: inline-block;
            font-size: 1.3em;
            margin-right: $interiorMarginSm;
        }

        &__name {
            @include ellipsize();
            display: inline;
        }
    }
</style>

<script>
    import treeItem from './tree-item.vue'

    export default {
        props: ['nodes'],
        name: 'mct-tree',
        components: {
            treeItem
        }
    }
</script>
