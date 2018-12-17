<template>
    <div class="c-tree__wrapper">
        <ul class="c-tree">
            <tree-item v-for="child in children"
                       :key="child.id"
                       :node="child">
            </tree-item>
        </ul>
    </div>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    .c-tree {
        @include userSelectNone();
        overflow-x: hidden;
        overflow-y: auto;
        height: 100%;

        &__wrapper {
            overflow-y: auto;
            padding-right: $interiorMarginSm;
        }

        .c-tree {
            margin-left: 15px;
        }

        &__item {
            $aPad: $interiorMarginSm;
            border-radius: $controlCr;
            display: flex;
            align-items: center;
            cursor: pointer;
            padding: $interiorMargin - $aPad;
            transition: background 150ms ease;

            &:hover {
                background: $colorItemTreeHoverBg;
                .c-tree__item__type-icon:before {
                    color: $colorItemTreeIconHover;
                }

                .c-tree__item__name {
                    color: $colorItemTreeHoverFg;
                }
            }

            &.is-navigated-object {
                background: $colorItemTreeSelectedBg;
                .c-tree__item__type-icon:before {
                    color: $colorItemTreeIconHover;
                }

                .c-tree__item__name {
                    color: $colorItemTreeSelectedFg;
                }
            }

            &.is-being-edited {
                background: $colorItemTreeEditingBg;
                .c-tree__item__type-icon:before {
                    color: $colorItemTreeEditingIcon;
                }

                .c-tree__item__name {
                    color: $colorItemTreeEditingFg;
                    font-style: italic;
                }
            }

            &__view-control {
                color: $colorItemTreeVC;
                margin-right: $interiorMarginSm;
            }

            &__label {
                // <a> tag that holds type icon and name.
                // Draggable element.
                border-radius: $controlCr;
                display: flex;
                align-items: center;
                flex: 1 1 auto;
                overflow: hidden;
                padding: $aPad;
                white-space: nowrap;
            }

            &__name {
                @include ellipsize();
                display: inline;
                color: $colorItemTreeFg;
                width: 100%;
            }

            &__type-icon {
                // Type icon. Must be HTML entity to allow inclusion of alias indicator.
                display: block;
                flex: 0 0 auto;
                font-size: 1.3em;
                margin-right: $interiorMarginSm;
                color: $colorItemTreeIcon;
                width: $treeTypeIconW;
            }

            &.is-alias {
                // Object is an alias to an original.
                [class*='__type-icon'] {
                    @include isAlias();
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
        methods: {
            treeElementsForObjectPath(navigationPath) {
                let idClass = '.js-object-' + navigationPath[navigationPath.length - 1];
                return this.$el.querySelectorAll(idClass);
            },
            applyNavigationStyles(newPath, oldPath) {
                let tokenizedNewPath = newPath.split('/');
                let tokenizedOldPath = (oldPath || '').split('/');

                if (tokenizedNewPath.length > 0) {
                    this.treeElementsForObjectPath(tokenizedNewPath).forEach((element) =>
                        element.classList.add('is-navigated-object')
                    );
                }
                if (tokenizedOldPath.length > 0) {
                    this.treeElementsForObjectPath(tokenizedOldPath).forEach((element) =>
                        element.classList.remove('is-navigated-object')
                    );
                }
            }
        },
        mounted: function () {
            this.openmct.objects.get('ROOT')
                .then(root => this.openmct.composition.get(root).load())
                .then(children => this.children = children.map((c) => {
                    return {
                        id: this.openmct.objects.makeKeyString(c.identifier),
                        object: c,
                        objectPath: [c]
                    };
                }));

            this.openmct.router.on('change:path', this.applyNavigationStyles);
        },
        name: 'mct-tree',
        components: {
            treeItem
        }
    }
</script>
