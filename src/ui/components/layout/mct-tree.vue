<template>
    <ul class="c-tree">
        <tree-item v-for="child in children"
                   :key="child.id"
                   :node="child">
        </tree-item>
    </ul>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    // TODO: make sure hit area encompasses all of the tree item; currently is just the text

    .c-tree {
        overflow-x: hidden;
        overflow-y: auto;
        height: 100%;

        .c-tree {
            margin-left: 15px;
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
        data() {
            return {
                children: []
            };
        },
        inject: ['openmct'],
        mounted: function () {
            this.openmct.objects.get('ROOT')
                .then(root => this.openmct.composition.get(root).load())
                .then(children => this.children = children.map((c) => {
                    return {
                        id: this.openmct.objects.makeKeyString(c.identifier),
                        object: c,
                        path: [c.identifier]
                    };
                }))
        },
        name: 'mct-tree',
        components: {
            treeItem
        }
    }
</script>
