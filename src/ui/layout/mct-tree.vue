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

    <div
        v-if="(searchValue && allTreeItems.length === 0 && !isLoading) || (searchValue && searchResultItems.length === 0)"
        class="c-tree-and-search__no-results"
    >
        No results found
    </div>

    <!-- loading -->
    <li
        v-if="isLoading"
        :style="loadingStyles()"
        class="c-tree-and-search__loading loading"
    ></li>
    <!-- end loading -->

    <!-- main tree -->
    <ul
        ref="mainTree"
        class="c-tree-and-search__tree c-tree"
    >
        <!-- ancestors -->
        <div v-if="!activeSearch">
            <tree-item
                v-for="(ancestor, index) in ancestors"
                :key="ancestor.id"
                :node="ancestor"
                :show-up="index < ancestors.length - 1"
                :show-down="false"
                :left-offset="index * 10 + 10 + 'px'"
                @resetTree="handleReset"
            />
        </div>
        <!-- currently viewed children -->
        <transition
            @enter="childrenIn"
        >
            <li
                v-if="!isLoading"
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
                            v-for="(treeItem, index) in visibleItems"
                            :key="treeItem.id"
                            :node="treeItem"
                            :left-offset="itemLeftOffset"
                            :item-offset="itemOffset"
                            :item-index="index"
                            :item-height="itemHeight"
                            :virtual-scroll="!noScroll"
                            @expanded="handleExpanded"
                        />
                    </div>
                </ul>
            </li>
        </transition>
    </ul>
    <!-- end main tree -->
</div>
</template>

<script>
import treeItem from './tree-item.vue'
import search from '../components/search.vue';

const LOCAL_STORAGE_KEY__TREE_EXPANDED = 'mct-tree-expanded';
const ROOT_PATH = '/browse/';
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
            searchResultItems: [],
            visibleItems: [],
            ancestors: [],
            childrenSlideClass: 'slide-left',
            availableContainerHeight: 0,
            noScroll: true,
            updatingView: false,
            itemHeight: 28,
            itemOffset: 0,
            childrenHeight: 0,
            scrollable: undefined,
            pageThreshold: 50,
            activeSearch: false
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
        },
        focusedItems() {
            return this.activeSearch ? this.searchResultItems : this.allTreeItems;
        },
        itemLeftOffset() {
            return this.activeSearch ? '0px' : this.ancestors.length * 10 + 10 + 'px';
        }
    },
    watch: {
        syncTreeNavigation() {
            const AND_SAVE_PATH = true;
            let currentLocationPath = this.openmct.router.currentLocation.path,
                jumpAndScroll = currentLocationPath &&
                    this.currentlyViewedObjectParentPath() &&
                    !this.currentPathIsActivePath(),
                justScroll = this.currentPathIsActivePath() && !this.noScroll;

            if(this.searchValue) {
                this.searchValue = '';
            }

            if(jumpAndScroll) {
                this.scrollTo = this.currentlyViewedObjectId();
                this.allChildren = [];
                this.ancestors = [];
                this.jumpPath = this.currentlyViewedObjectParentPath();
                this.jumpToPath(AND_SAVE_PATH);
            } else if(justScroll) {
                this.scrollTo = this.currentlyViewedObjectId();
                this.autoScroll();
            }
        },
        searchValue() {
            if(this.searchValue !== '' && !this.activeSearch) {
                this.searchActivated();
            } else if(this.searchValue === '') {
                this.searchDeactivated();
            }
        },
        searchResultItems() {
            this.setContainerHeight();
            this.setChildrenHeight();
        }
    },
    mounted() {
        let savedPath = this.getSavedNavigatedPath();
        if(savedPath) {
            let scrollIfApplicable = () => {
                if(this.currentPathIsActivePath()) {
                    this.scrollTo = this.currentlyViewedObjectId();
                }
            };
            this.jumpPath = savedPath;
            this.afterJump = scrollIfApplicable;
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
        updatevisibleItems() {
            if (!this.updatingView) {
                this.updatingView = true;
                requestAnimationFrame(()=> {
                    let start = 0,
                        end = this.pageThreshold,
                        allItemsCount = this.focusedItems.length;

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
                    this.visibleItems = this.focusedItems.slice(start, end);

                    this.updatingView = false;
                });
            }
        },
        setContainerHeight() {
            this.$nextTick(() => {
                let mainTree = this.$refs.mainTree,
                    mainTreeHeight = mainTree.clientHeight;

                if(mainTreeHeight !== 0) {
                    let ancestorsHeight = this.calculateAncestorHeight(),
                        allChildrenHeight = this.calculateChildrenHeight();

                    if(this.activeSearch) {
                        ancestorsHeight = 0;
                    }
                    this.availableContainerHeight = mainTreeHeight - ancestorsHeight;

                    if(allChildrenHeight > this.availableContainerHeight) {
                        this.setPageThreshold();
                        this.noScroll = false;
                    } else {
                        this.noScroll = true;
                    }
                    this.updatevisibleItems();
                } else {
                    setTimeout(this.setContainerHeight, MAIN_TREE_RECHECK_DELAY);
                }
            });
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
            let childrenCount = this.focusedItems.length;
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
            let threshold = Math.ceil(this.availableContainerHeight / this.itemHeight) + ITEM_BUFFER;
            // all items haven't loaded yet (nextTick not working for this)
            if(threshold === ITEM_BUFFER) {
                setTimeout(this.setPageThreshold, 100);
            } else {
                this.pageThreshold = threshold;
            }
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
                navigateToParent: ROOT_PATH + this.currentNavigatedPath
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
                    if(this.afterJump) {
                        this.$nextTick(() => {
                            this.afterJump();
                            delete this.afterJump;
                        });
                    }
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
        getSearchResults() {
            this.searchService.query(this.searchValue).then(children => {
                this.searchResultItems = children.hits.map(child => {

                    let context = child.object.getCapability('context'),
                        object = child.object.useCapability('adapter'),
                        objectPath = [],
                        navigateToParent;

                    if (context) {
                        objectPath = context.getPath().slice(1)
                            .map(oldObject => oldObject.useCapability('adapter'))
                            .reverse();
                        navigateToParent = objectPath.slice(1)
                            .map((parent) => this.openmct.objects.makeKeyString(parent.identifier));
                        navigateToParent = ROOT_PATH + navigateToParent.reverse().join('/');
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
                this.getSearchResults();
            }
        },
        searchActivated() {
            this.activeSearch = true;
            this.$refs.scrollable.scrollTop = 0;
        },
        searchDeactivated() {
            this.activeSearch = false;
            this.$refs.scrollable.scrollTop = 0;
            this.setContainerHeight();
            this.setChildrenHeight();
        },
        handleReset(node) {
            this.childrenSlideClass = 'slide-right';
            this.ancestors.splice(this.ancestors.indexOf(node) + 1);
            this.getAllChildren(node);
            this.setCurrentNavigatedPath();
        },
        handleExpanded(node) {
            if(!this.activeSearch) {
                this.childrenSlideClass = 'slide-left';
                let newParent = this.buildTreeItem(node);
                this.ancestors.push(newParent);
                this.getAllChildren(newParent);
                this.setCurrentNavigatedPath();
            }
        },
        getSavedNavigatedPath() {
            return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY__TREE_EXPANDED));
        },
        setCurrentNavigatedPath() {
            if(!this.searchValue) {
                localStorage.setItem(LOCAL_STORAGE_KEY__TREE_EXPANDED, JSON.stringify(this.currentNavigatedPath));
            }
        },
        currentPathIsActivePath() {
            return this.getSavedNavigatedPath() === this.currentlyViewedObjectParentPath();
        },
        currentlyViewedObjectId() {
            let currentPath = this.openmct.router.currentLocation.path,
                id;
            if(currentPath) {
                currentPath = currentPath.split(ROOT_PATH)[1];
                id = currentPath.split('/').pop();
            }
            return id;
        },
        currentlyViewedObjectParentPath() {
            let currentPath = this.openmct.router.currentLocation.path,
                path;
            if(currentPath) {
                currentPath = currentPath.split(ROOT_PATH)[1];
                currentPath = currentPath.split('/');
                currentPath.pop();
                path = currentPath.join('/');
            }
            return path;
        },
        scrollItems(event) {
            if(!windowResizing) {
                this.updatevisibleItems();
            }
        },
        scrollableStyles() {
            return {
                height: this.availableContainerHeight + 'px',
                overflow: this.noScroll ? 'hidden' : 'scroll'
            }
        },
        loadingStyles() {
            let styles = {
                top: '300px'
            }

            if(this.$refs.mainTree && this.$refs.mainTree.clientHeight !== 0) {
                styles.top = (this.$refs.mainTree.clientHeight / 2) + 'px';
            }

            return styles;
        },
        childrenIn(el, done) {
            // more reliable way then nextTick
            this.setContainerHeight();
            this.setChildrenHeight();
            done();
        }
    }
}
</script>
