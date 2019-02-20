<template>
    <div class="c-tree__wrapper">
        <div class="l-shell__search">
            <search class="c-search--major" ref="shell-search"
                :value="searchValue"
                @input="searchTree"
                @clear="searchTree">
            </search>
        </div>
        <div
            v-if="treeItems.length === 0">
            No results found
        </div>
        <ul class="c-tree">
            <tree-item v-for="treeItem in treeItems"
                       :key="treeItem.id"
                       :node="treeItem">
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
            line-height: 110%;
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
    import search from '../components/search.vue';

    export default {
        inject: ['openmct'],
        name: 'mct-tree',
        components: {
            search,
            treeItem
        },
        data() {
            return {
                searchValue: '',
                allTreeItems: [],
                filteredTreeItems: []
            }
        },
        computed: {
            treeItems() {
                if (this.searchValue === '') {
                    return this.allTreeItems;
                } else {
                    return this.filteredTreeItems;
                }
            }
        },
        methods: {
            getAllChildren() {
                this.openmct.objects.get('ROOT')
                    .then(root => this.openmct.composition.get(root).load())
                    .then(children => {
                        this.allTreeItems = children.map(c => {
                                return {
                                    id: this.openmct.objects.makeKeyString(c.identifier),
                                    object: c,
                                    objectPath: [c]
                            };
                        });
                    });
            },
            getFilteredChildren() {
                this.searchService.query(this.searchValue).then(children => {
                    this.filteredTreeItems = children.hits.map(child => {
                        
                        let context = child.object.getCapability('context'),
                            object = child.object.useCapability('adapter'),
                            objectPath = [];

                        if (context) {
                            objectPath = context.getPath().slice(1)
                                .map(oldObject => oldObject.useCapability('adapter'))
                                .reverse();  
                        }

                        return {
                            id: this.openmct.objects.makeKeyString(object.identifier),
                            object,
                            objectPath
                        }
                    });
                });
            },
            searchTree(value) {
                this.searchValue = value;
                
                if (this.searchValue !== '') {
                    this.getFilteredChildren();
                }
            }
        },
        mounted() {
            this.searchService = this.openmct.$injector.get('searchService');
            this.getAllChildren();
        }
    }
</script>
