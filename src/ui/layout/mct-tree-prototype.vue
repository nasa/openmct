<template>
    <div class="c-tree-and-search">
        <div class="c-tree-and-search__search">
            <search class="c-search" ref="shell-search"
                :value="searchValue"
                @input="searchTree"
                @clear="searchTree">
            </search>
        </div>

        <!-- loading -->
        <div class="c-tree-and-search__loading loading"
            v-if="isLoading"></div>
        <!-- end loading -->

        <!-- main tree -->
        <ul class="c-tree-and-search__tree c-tree"
            v-if="!isLoading"
            v-show="!searchValue">

            <tree-item
                v-if="parentNode && parentNode.id !== 'ROOT'"
                :key="parentNode.id"
                :node="parentNode"
                :isExpanded="true"
                @notExpanded="navigateToParent">
            </tree-item>

            <tree-item 
                v-for="treeItem in allTreeItems"
                :key="treeItem.id"
                :node="treeItem"
                @expanded="setParentAndLoadChildren">
            </tree-item>
        </ul>
        <!-- end main tree -->

        <!-- search tree -->
        <ul class="c-tree-and-search__tree c-tree"
            v-if="searchValue">
            <tree-item v-for="treeItem in filteredTreeItems"
                    :key="treeItem.id"
                    :node="treeItem">
            </tree-item>
        </ul>
        <!-- end search tree -->

        <div class="c-tree-and-search__no-results" 
            v-if="(allTreeItems.length === 0) || (searchValue && filteredTreeItems.length === 0)">
            No results found
        </div>
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
    import treeItem from './tree-item-prototype.vue'
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
                filteredTreeItems: [],
                isLoading: false,
                currentObjectPath: [],
                parentNode: undefined
            }
        },
        methods: {
            getRootChildren() {
                this.openmct.objects.get('ROOT')
                    .then(root => {
                        let rootNode = this.buildTreeItems(root);
                        this.getAllChildren(rootNode);
                    })
            },
            getAllChildren(node) {
                this.isLoading = true;

                if (this.composition) {
                    this.composition.off('add', this.addChild);
                    this.composition.off('remove', this.removeChild);
                    delete this.composition;
                }

                this.parentNode = node;
                this.currentObjectPath = this.parentNode.objectPath;
                this.allTreeItems = [];

                this.composition = this.openmct.composition.get(node.object);
                this.composition.on('add', this.addChild);
                this.composition.on('remove', this.removeChild);
                this.composition.load().then(() => {
                    this.isLoading = false;
                });
            },
            buildTreeItems(domainObject) {
                return {
                    id: this.openmct.objects.makeKeyString(domainObject.identifier),
                    object: domainObject,
                    objectPath: [domainObject].concat(this.currentObjectPath),
                    navigateToParent: '/browse'
                };
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
            },
            buildPathString(parentPath) {
                return [parentPath, this.parentNode.id].join('/');
            },
            addChild (child) {
                this.allTreeItems.push(this.buildTreeItems(child));
            },
            removeChild(identifier) {
                let removeId = this.openmct.objects.makeKeyString(identifier);
                this.allChildren = this.children
                    .filter(c => c.id !== removeId);
            },
            navigateToParent(node) {
                let parentDomainObject = node.objectPath[1],
                    parentNode = {
                    id: this.openmct.objects.makeKeyString(parentDomainObject.identifier),
                    object: parentDomainObject,
                    objectPath: node.objectPath.slice(1),
                    navigateToParent: '/browse'
                }

                this.getAllChildren(parentNode);
            },
            setParentAndLoadChildren(node){
                this.getAllChildren(node);
            }
        },
        mounted() {
            this.searchService = this.openmct.$injector.get('searchService');
            this.getRootChildren();
        }
    }
</script>
