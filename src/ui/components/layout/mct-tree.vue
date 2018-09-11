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

    .c-tree {
        @include userSelectNone();
        overflow-x: hidden;
        overflow-y: auto;
        height: 100%;

        .c-tree {
            margin-left: 15px;
        }

        &__item {
            border-radius: $controlCr;
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

            &__view-control {
                color: $colorItemTreeVC;
                margin-right: $interiorMarginSm;
            }

            &__name {
                color: $colorItemTreeFg;
                width: 100%;
                &:before {
                    color: $colorItemTreeIcon;
                    width: $treeTypeIconW;
                }
            }

            body.mobile & {
                @include button($bg: $colorMobilePaneLeftTreeItemBg, $fg: $colorMobilePaneLeftTreeItemFg);
                height: $mobileTreeItemH;
                margin-bottom: $interiorMarginSm;
                [class*="view-control"] {
                    width: ceil($mobileTreeItemH * 0.5);
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
