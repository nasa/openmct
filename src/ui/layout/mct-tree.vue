<template>
<div class="c-tree-and-search">
    <div class="c-tree-and-search__search">
        <search
            ref="shell-search"
            class="c-search"
            :value="searchValue"
            @input="searchTree"
            @clear="searchTree"
        />
    </div>

    <!-- loading -->
    <div
        v-if="isLoading"
        class="c-tree-and-search__loading loading"
    ></div>
    <!-- end loading -->

    <div
        v-if="(allTreeItems.length === 0) || (searchValue && filteredTreeItems.length === 0)"
        class="c-tree-and-search__no-results"
    >
        No results found
    </div>

    <!-- main tree -->
    <ul
        v-if="!isLoading"
        v-show="!searchValue"
        class="c-tree-and-search__tree c-tree"
    >
        <tree-item
            v-for="treeItem in allTreeItems"
            :key="treeItem.id"
            :node="treeItem"
        />
    </ul>
    <!-- end main tree -->

    <!-- search tree -->
    <ul
        v-if="searchValue"
        class="c-tree-and-search__tree c-tree"
    >
        <tree-item
            v-for="treeItem in filteredTreeItems"
            :key="treeItem.id"
            :node="treeItem"
        />
    </ul>
    <!-- end search tree -->
</div>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    .c-tree-and-search {
        display: flex;
        flex-direction: column;
        padding-right: $interiorMarginSm;
        overflow: auto;

        > * + * { margin-top: $interiorMargin; }

        &__search {
            flex: 0 0 auto;
        }

        &__loading {
            flex: 1 1 auto;
        }

        &__no-results {
            font-style: italic;
            opacity: 0.6;
        }

        &__tree {
            flex: 1 1 auto;
            height: 0; // Chrome 73 overflow bug fix
        }
    }

    .c-tree {
        @include userSelectNone();
        overflow-x: hidden;
        overflow-y: auto;
        padding-right: $interiorMargin;

        li {
            position: relative;
            &.c-tree__item-h { display: block; }
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

            > * + * {
                margin-left: $interiorMarginSm;
            }

            &:hover {
                background: $colorItemTreeHoverBg;
                .c-tree__item__type-icon:before {
                    color: $colorItemTreeIconHover;
                }

                .c-tree__item__name {
                    color: $colorItemTreeHoverFg;
                }
            }

            &.is-navigated-object,
            &.is-selected {
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

            // Object labels in trees
            &__label {
                // <a> tag that holds type icon and name.
                // Draggable element.
                /*border-radius: $controlCr;
                display: flex;
                align-items: center;
                flex: 1 1 auto;
                overflow: hidden;
                padding: $aPad;
                white-space: nowrap;*/
            }

            &__name {
               // @include ellipsize();
               // display: inline;
                color: $colorItemTreeFg;
              //  width: 100%;
            }

            &__type-icon {
                // Type icon. Must be an HTML entity to allow inclusion of alias indicator.
               // display: block;
             //   flex: 0 0 auto;
              //  font-size: 1.3em;
              //  margin-right: $interiorMarginSm;
                color: $colorItemTreeIcon;
              //  width: $treeTypeIconW;
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
    name: 'MctTree',
    components: {
        search,
        treeItem
    },
    data() {
        return {
            searchValue: '',
            allTreeItems: [],
            filteredTreeItems: [],
            isLoading: false
        }
    },
    mounted() {
        this.searchService = this.openmct.$injector.get('searchService');
        this.getAllChildren();
    },
    methods: {
        getAllChildren() {
            this.isLoading = true;
            this.openmct.objects.get('ROOT')
                .then(root => {
                    return this.openmct.composition.get(root).load()
                })
                .then(children => {
                    this.isLoading = false;
                    this.allTreeItems = children.map(c => {
                        return {
                            id: this.openmct.objects.makeKeyString(c.identifier),
                            object: c,
                            objectPath: [c],
                            navigateToParent: '/browse'
                        };
                    });
                });
        },
        getFilteredChildren() {
            this.searchService.query(this.searchValue).then(children => {
                this.filteredTreeItems = children.hits.map(child => {

                    let context = child.object.getCapability('context'),
                        object = child.object.useCapability('adapter'),
                        objectPath = [],
                        navigateToParent;

                    if (context) {
                        objectPath = context.getPath().slice(1)
                            .map(oldObject => oldObject.useCapability('adapter'))
                            .reverse();
                        navigateToParent = '/browse/' + objectPath.slice(1)
                            .map((parent) => this.openmct.objects.makeKeyString(parent.identifier))
                            .join('/');
                    }

                    return {
                        id: this.openmct.objects.makeKeyString(object.identifier),
                        object,
                        objectPath,
                        navigateToParent
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
    }
}
</script>
