<template>
<div
    class="c-tree-and-search"
>
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
        v-show="!searchValue && !isLoading"
        ref="mainTree"
        class="c-tree-and-search__tree c-tree"
    >
        <!-- ancestors -->
        <tree-item
            v-for="(ancestor, index) in ancestors"
            :key="ancestor.id"
            :node="ancestor"
            :show-up="index < ancestors.length - 1"
            :show-down="false"
            :left-offset="index * 10 + 10 + 'px'"
            @resetTree="handleReset"
        />
        <!-- currently viewed children -->
        <li
            :class="childrenSlideClass"
            style="{ position: relative }"
        >
            <ul
                ref="scrollable"
                class="scrollable-children"
                :style="scrollableStyles()"
                @scroll="scrollItems"
            >
                <div
                    :style="{ height: childrenHeight + 'px'}"
                >
                    <tree-item
                        v-for="(treeItem, index) in visibleTreeItems"
                        :key="treeItem.id"
                        :node="treeItem"
                        :left-offset="ancestors.length * 10 + 10 + 'px'"
                        :item-offset="itemOffset"
                        :item-index="index"
                        :item-height="itemHeight"
                        :virtual-scroll="!noScroll"
                        @expanded="handleExpanded"
                    />
                </div>
            </ul>
        </li>
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

<script>
import treeItem from './tree-item.vue'
import search from '../components/search.vue';

const LOCAL_STORAGE_KEY__TREE_EXPANDED = 'mct-tree-expanded';
const ITEM_BUFFER = 5;
const MAIN_TREE_RECHECK_DELAY = 100;
const RESIZE_FIRE_DELAY_MS = 500;
let windowResizeId = undefined,
    windowResizing = false;

export default {
    inject: ['openmct'],
    name: 'MctTree',
    components: {
        search,
        treeItem
    },
    props: {
        syncTreeNavigation: {
            type: Boolean,
            required: true
        }
    },
    data() {
        return {
            isLoading: false,
            searchValue: '',
            allTreeItems: [],
            visibleTreeItems: [],
            filteredTreeItems: [],
            ancestors: [],
            childrenSlideClass: 'slide-left',
            availableContainerHeight: 0,
            noScroll: true,
            updatingView: false,
            itemHeight: 28,
            itemOffset: 0,
            childrenHeight: 0,
            scrollable: undefined,
            pageThreshold: 50
        }
    },
    computed: {
        currentNavigatedPath() {
            return this.ancestors
                .map((ancestor) => ancestor.id)
                .join('/');
        },
        currentObjectPath() {
            let ancestorsCopy = [...this.ancestors];
            return ancestorsCopy
                .reverse()
                .map((ancestor) => ancestor.object);
        }
    },
    watch: {
        syncTreeNavigation() {
            let currentLocationPath = this.openmct.router.currentLocation.path,
                descendantPath = currentLocationPath.split('/browse/')[1],
                alreadyNavigatedCheck = descendantPath.split('/'),
                alreadyNavigated;

            alreadyNavigatedCheck.pop();
            alreadyNavigatedCheck = alreadyNavigatedCheck.join('/');
            alreadyNavigated = this.currentNavigatedPath === alreadyNavigatedCheck;
            descendantPath = descendantPath.split('/');

            if(currentLocationPath && !alreadyNavigated) {
                this.scrollTo = descendantPath.pop();
                descendantPath = descendantPath.join('/');
                this.allChildren = [];
                this.ancestors = [];
                this.jumpPath = descendantPath;
                this.jumpToPath(true);
            } else if(alreadyNavigated && !this.noScroll) {
                this.scrollTo = descendantPath.pop();
                this.autoScroll();
            }
        },
        allTreeItems() {
            this.setChildrenHeight();
            this.setContainerHeight();
        }
    },
    mounted() {
        let savedPath = this.getSavedNavigatedPath();
        if(savedPath) {
            this.jumpPath = savedPath;
        }
        this.searchService = this.openmct.$injector.get('searchService');
        window.addEventListener('resize',  this.handleWindowResize);
        this.openmct.objects.get('ROOT').then(root => {
            let rootNode = this.buildTreeItem(root);
            this.getAllChildren(rootNode);
        });
    },
    destroyed() {
        window.removeEventListener('resize', this.handleWindowResize);
    },
    methods: {
        updatevisibleTreeItems() {
            if (!this.updatingView) {
                this.updatingView = true;
                requestAnimationFrame(()=> {
                    let start = 0,
                        end = this.pageThreshold,
                        allItemsCount = this.allTreeItems.length;

                    if (allItemsCount < this.pageThreshold) {
                        end = allItemsCount;
                    } else {
                        let firstVisible = this.calculateFirstVisibleItem(),
                            lastVisible = this.calculateLastVisibleItem(),
                            totalVisible = lastVisible - firstVisible,
                            numberOffscreen = this.pageThreshold - totalVisible;

                        start = firstVisible - Math.floor(numberOffscreen / 2);
                        end = lastVisible + Math.ceil(numberOffscreen / 2);

                        if (start < 0) {
                            start = 0;
                            end = Math.min(this.pageThreshold, allItemsCount);
                        } else if (end >= allItemsCount) {
                            end = allItemsCount;
                            start = end - this.pageThreshold + 1;
                        }
                    }
                    this.itemOffset = start;
                    this.visibleTreeItems = this.allTreeItems.slice(start, end);

                    this.updatingView = false;
                });
            }
        },
        setContainerHeight() {
            if(this.$refs.mainTree) {
                let mainTree = this.$refs.mainTree,
                    mainTreeHeight = mainTree.clientHeight;

                if(mainTreeHeight !== 0) {
                    let ancestorsHeight = this.calculateAncestorHeight(),
                        allChildrenHeight = this.calculateChildrenHeight();

                    this.availableContainerHeight = mainTreeHeight - ancestorsHeight;

                    if(allChildrenHeight > this.availableContainerHeight) {
                        this.setPageThreshold();
                        this.noScroll = false;
                    } else {
                        this.noScroll = true;
                    }
                    this.updatevisibleTreeItems();
                } else {
                    setTimeout(this.setContainerHeight, MAIN_TREE_RECHECK_DELAY);
                }
            }
        },
        calculateFirstVisibleItem() {
            let scrollTop = this.$refs.scrollable.scrollTop;
            return Math.floor(scrollTop / this.itemHeight);
        },
        calculateLastVisibleItem() {
            let scrollBottom = this.$refs.scrollable.scrollTop + this.$refs.scrollable.offsetHeight;
            return Math.ceil(scrollBottom / this.itemHeight);
        },
        calculateChildrenHeight() {
            let childrenCount = this.allTreeItems.length;
            return this.itemHeight * childrenCount;
        },
        setChildrenHeight() {
            this.childrenHeight = this.calculateChildrenHeight();
        },
        calculateAncestorHeight() {
            let ancestorCount = this.ancestors.length;
            return this.itemHeight * ancestorCount;
        },
        setPageThreshold() {
            this.pageThreshold = Math.ceil(this.availableContainerHeight / this.itemHeight) + ITEM_BUFFER;
        },
        handleWindowResize() {
            if(!windowResizing) {
                windowResizing = true;
                window.clearTimeout(windowResizeId);
                windowResizeId = window.setTimeout(() => {
                    this.setContainerHeight();
                    windowResizing = false;
                }, RESIZE_FIRE_DELAY_MS);
            }
        },
        getAllChildren(node) {
            this.isLoading = true;
            if (this.composition) {
                this.composition.off('add', this.addChild);
                this.composition.off('remove', this.removeChild);
                delete this.composition;
            }
            this.allTreeItems = [];
            this.composition = this.openmct.composition.get(node.object);
            this.composition.on('add', this.addChild);
            this.composition.on('remove', this.removeChild);
            this.composition.load().then(this.finishLoading);
        },
        buildTreeItem(domainObject) {
            return {
                id: this.openmct.objects.makeKeyString(domainObject.identifier),
                object: domainObject,
                objectPath: [domainObject].concat(this.currentObjectPath),
                navigateToParent: '/browse/' + this.currentNavigatedPath
            };
        },
        addChild(child) {
            this.allTreeItems.push(this.buildTreeItem(child));
        },
        removeChild(identifier) {
            let removeId = this.openmct.objects.makeKeyString(identifier);
            this.allChildren = this.children
                .filter(c => c.id !== removeId);
        },
        finishLoading() {
            this.isLoading = false;
            if(this.jumpPath) {
                this.jumpToPath();
            }
            this.autoScroll();
        },
        async jumpToPath(saveExpandedPath = false) {
            let nodes = this.jumpPath.split('/'),
                currentNode,
                newParent;

            for(let i = 0; i < nodes.length; i++) {
                currentNode = await this.openmct.objects.get(nodes[i]);
                newParent = this.buildTreeItem(currentNode);
                this.ancestors.push(newParent);
                if(i === nodes.length - 1) {
                    this.jumpPath = '';
                    this.getAllChildren(newParent);
                    if(saveExpandedPath) {
                        this.setCurrentNavigatedPath();
                    }
                }
            }
        },
        autoScroll() {
            if(this.scrollTo) {
                let indexOfScroll = this.indexOfItemById(this.scrollTo);
                this.$nextTick(() => {
                    this.$refs.scrollable.scrollTop = indexOfScroll * this.itemHeight;
                });
                this.scrollTo = undefined;
            }
        },
        indexOfItemById(id) {
            for(let i = 0; i < this.allTreeItems.length; i++) {
                if(this.allTreeItems[i].id === id) {
                    return i;
                }
            }
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
        handleReset(node) {
            this.childrenSlideClass = 'slide-right';
            this.ancestors.splice(this.ancestors.indexOf(node) + 1);
            this.getAllChildren(node);
            this.setCurrentNavigatedPath();
        },
        handleExpanded(node) {
            this.childrenSlideClass = 'slide-left';
            let newParent = this.buildTreeItem(node);
            this.ancestors.push(newParent);
            this.getAllChildren(newParent);
            this.setCurrentNavigatedPath();
        },
        getSavedNavigatedPath() {
            return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY__TREE_EXPANDED));
        },
        setCurrentNavigatedPath() {
            localStorage.setItem(LOCAL_STORAGE_KEY__TREE_EXPANDED, JSON.stringify(this.currentNavigatedPath));
        },
        scrollItems(event) {
            if(!windowResizing) {
                this.updatevisibleTreeItems();
            }
        },
        scrollableStyles() {
            return {
                height: this.availableContainerHeight + 'px',
                overflow: this.noScroll ? 'hidden' : 'scroll'
            }
        }
    }
}
</script>
