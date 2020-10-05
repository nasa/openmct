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

    <!-- search loading -->
    <li
        v-if="searchLoading && activeSearch"
        class="c-tree__item c-tree-and-search__loading loading"
    >
        <span class="c-tree__item__label">Searching...</span>
    </li>

    <!-- no results -->
    <div
        v-if="(searchValue && searchResultItems.length === 0 && !searchLoading)"
        class="c-tree-and-search__no-results"
    >
        No results found
    </div>

    <!-- main tree -->
    <ul
        ref="mainTree"
        class="c-tree-and-search__tree c-tree"
    >
        <!-- ancestors -->
        <li v-if="!activeSearch">
            <tree-item
                v-for="(ancestor, index) in ancestors"
                :key="ancestor.id"
                :node="ancestor"
                :show-up="index < ancestors.length - 1"
                :show-down="false"
                :left-offset="index * 10 + 'px'"
                :emit-height="getItemHeight"
                @emittedHeight="setItemHeight"
                @resetTree="handleReset"
            />
            <!-- loading -->
            <div
                v-if="isLoading"
                :style="indicatorLeftOffset"
                class="c-tree__item c-tree-and-search__loading loading"
            >
                <span class="c-tree__item__label">Loading...</span>
            </div>
            <!-- end loading -->
        </li>

        <!-- currently viewed children -->
        <transition
            name="children"
            appear
        >
            <li
                v-if="!isLoading && !searchLoading"
                :style="childrenListStyles()"
                :class="childrenSlideClass"
            >
                <ul
                    ref="scrollable"
                    class="c-tree__scrollable-children"
                    :style="scrollableStyles()"
                    @scroll="scrollItems"
                >
                    <div :style="{ height: childrenHeight() + 'px' }">
                        <tree-item
                            v-for="(treeItem, index) in visibleItems"
                            :key="treeItem.id"
                            :node="treeItem"
                            :left-offset="itemLeftOffset"
                            :item-offset="itemOffset"
                            :item-index="index"
                            :item-height="itemHeight"
                            :virtual-scroll="true"
                            :show-down="activeSearch ? false : true"
                            @expanded="handleExpanded"
                        />
                        <li
                            v-if="visibleItems.length === 0 && !noVisibleItems && !activeSearch"
                            :style="indicatorLeftOffset"
                            class="c-tree__item c-tree__item--empty"
                        >
                            No items
                        </li>
                    </div>
                </ul>
            </li>
        </transition>
    </ul>
    <!-- end main tree -->
</div>
</template>

<script>
import _ from 'lodash';
import treeItem from './tree-item.vue';
import search from '../components/search.vue';

const LOCAL_STORAGE_KEY__TREE_EXPANDED__OLD = 'mct-tree-expanded';
const LOCAL_STORAGE_KEY__EXPANDED_TREE_NODE = 'mct-expanded-tree-node';
const ROOT_PATH = '/browse/';
const ITEM_BUFFER = 5;
const RECHECK_DELAY = 100;
const RESIZE_FIRE_DELAY_MS = 500;
let windowResizeId = undefined;
let windowResizing = false;

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
        let isMobile = this.openmct.$injector.get('agentService');

        return {
            isLoading: false,
            searchLoading: false,
            searchValue: '',
            allTreeItems: [],
            searchResultItems: [],
            visibleItems: [],
            ancestors: [],
            childrenSlideClass: 'down',
            availableContainerHeight: 0,
            updatingView: false,
            itemHeightCalculated: false,
            itemHeight: 28,
            itemOffset: 0,
            scrollable: undefined,
            activeSearch: false,
            getItemHeight: false,
            settingChildrenHeight: false,
            isMobile: isMobile.mobileName,
            multipleRootChildren: false,
            noVisibleItems: false,
            observedAncestors: {}
        };
    },
    computed: {
        currentNavigatedPath() {
            let ancestorsCopy = [...this.ancestors];
            if (this.multipleRootChildren) {
                ancestorsCopy.shift(); // remove root
            }

            return ancestorsCopy
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
            return this.activeSearch ? '0px' : this.ancestors.length * 10 + 'px';
        },
        indicatorLeftOffset() {
            let offset = ((this.ancestors.length + 1) * 10);

            return {
                paddingLeft: offset + 'px'
            };
        },
        ancestorsHeight() {
            if (this.activeSearch) {
                return 0;
            }

            return this.itemHeight * this.ancestors.length;
        },
        pageThreshold() {
            return Math.ceil(this.availableContainerHeight / this.itemHeight) + ITEM_BUFFER;
        }
    },
    watch: {
        syncTreeNavigation() {
            const AND_SAVE_PATH = true;
            let currentLocationPath = this.openmct.router.currentLocation.path;
            let hasParent = this.currentlyViewedObjectParentPath() || (this.multipleRootChildren && !this.currentlyViewedObjectParentPath());
            let jumpAndScroll = currentLocationPath
                    && hasParent
                    && !this.currentPathIsActivePath();
            let justScroll = this.currentPathIsActivePath();

            if (this.searchValue) {
                this.searchValue = '';
            }

            if (jumpAndScroll) {
                this.scrollTo = this.currentlyViewedObjectId();
                this.allTreeItems = [];
                this.jumpPath = this.currentlyViewedObjectParentPath();
                if (this.multipleRootChildren) {
                    if (!this.jumpPath) {
                        this.jumpPath = 'ROOT';
                        this.ancestors = [];
                    } else {
                        this.ancestors = [this.ancestors[0]];
                    }
                } else {
                    this.ancestors = [];
                }

                this.jumpToPath(AND_SAVE_PATH);
            } else if (justScroll) {
                this.scrollTo = this.currentlyViewedObjectId();
                this.autoScroll();
            }
        },
        searchValue() {
            if (this.searchValue !== '' && !this.activeSearch) {
                this.searchActivated();
            } else if (this.searchValue === '') {
                this.searchDeactivated();
            }
        },
        allTreeItems() {
            // catches an edge case when new items are added (ex. folder)
            if (!this.isLoading) {
                this.setContainerHeight();
            }
        },
        ancestors() {
            this.observeAncestors();
        },
        availableContainerHeight() {
            this.updateVisibleItems();
        },
        focusedItems() {
            this.updateVisibleItems();
        }
    },
    async mounted() {
        await this.$nextTick();

        this.backwardsCompatibilityCheck();

        let savedPath = this.getSavedNavigatedPath();
        this.searchService = this.openmct.$injector.get('searchService');
        window.addEventListener('resize', this.handleWindowResize);

        let root = await this.openmct.objects.get('ROOT');

        if (root.identifier !== undefined) {
            let rootNode = this.buildTreeItem(root);
            let rootCompositionCollection = this.openmct.composition.get(root);
            let rootComposition = await rootCompositionCollection.load();

            // if more than one root item, set multipleRootChildren to true and add root to ancestors
            if (rootComposition && rootComposition.length > 1) {
                this.ancestors.push(rootNode);
                if (!this.itemHeightCalculated) {
                    await this.calculateItemHeight();
                }

                this.multipleRootChildren = true;
            } else if (!savedPath && rootComposition[0] !== undefined) {
                // needed if saved path is not set, need to set it to the only root child
                savedPath = rootComposition[0].identifier;
            }

            if (savedPath) {
                let scrollIfApplicable = () => {
                    if (this.currentPathIsActivePath()) {
                        this.scrollTo = this.currentlyViewedObjectId();
                    }
                };

                this.jumpPath = savedPath;
                this.afterJump = scrollIfApplicable;
            }

            this.getAllChildren(rootNode);
        }
    },
    created() {
        this.getSearchResults = _.debounce(this.getSearchResults, 400);
        this.setContainerHeight = _.debounce(this.setContainerHeight, 200);
    },
    updated() {
        this.$nextTick(() => {
            this.setContainerHeight();
        });
    },
    destroyed() {
        window.removeEventListener('resize', this.handleWindowResize);
        this.stopObservingAncestors();
    },
    methods: {
        updateVisibleItems() {
            if (this.updatingView) {
                return;
            }

            this.updatingView = true;
            requestAnimationFrame(() => {
                let start = 0;
                let end = this.pageThreshold;
                let allItemsCount = this.focusedItems.length;

                if (allItemsCount < this.pageThreshold) {
                    end = allItemsCount;
                } else {
                    let firstVisible = this.calculateFirstVisibleItem();
                    let lastVisible = this.calculateLastVisibleItem();
                    let totalVisible = lastVisible - firstVisible;
                    let numberOffscreen = this.pageThreshold - totalVisible;

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
                this.noVisibleItems = false;

                this.updatingView = false;
            });
        },
        setContainerHeight() {
            let mainTree = this.$refs.mainTree;
            let mainTreeHeight = mainTree && mainTree.clientHeight ? mainTree.clientHeight : 0;

            if (mainTreeHeight !== 0) {
                this.availableContainerHeight = mainTreeHeight - this.ancestorsHeight;
            } else {
                window.setTimeout(this.setContainerHeight, RECHECK_DELAY);
            }
        },
        childrenHeight() {
            if (!this.$refs.mainTree) {
                return;
            }

            let mainTreeTopMargin = this.getElementStyleValue(this.$refs.mainTree, 'marginTop');
            let childrenCount = this.focusedItems.length || 1;

            return (this.itemHeight * childrenCount) - mainTreeTopMargin; // 5px margin
        },
        calculateFirstVisibleItem() {
            if (!this.$refs.scrollable) {
                return;
            }

            let scrollTop = this.$refs.scrollable.scrollTop;

            return Math.floor(scrollTop / this.itemHeight);
        },
        calculateLastVisibleItem() {
            if (!this.$refs.scrollable) {
                return;
            }

            let scrollBottom = this.$refs.scrollable.scrollTop + this.$refs.scrollable.offsetHeight;

            return Math.ceil(scrollBottom / this.itemHeight);
        },
        calculateItemHeight() {
            this.getItemHeight = true;

            return new Promise((resolve, reject) => {
                this.itemHeightResolve = resolve;
            });
        },
        async setItemHeight(height) {

            if (this.itemHeightCalculated) {
                return;
            }

            await this.$nextTick();

            this.itemHeight = height;
            this.itemHeightCalculated = true;
            this.getItemHeight = false;

            this.itemHeightResolve();
        },
        handleWindowResize() {
            if (!windowResizing) {
                windowResizing = true;
                window.clearTimeout(windowResizeId);
                windowResizeId = window.setTimeout(() => {
                    this.setContainerHeight();
                    windowResizing = false;
                }, RESIZE_FIRE_DELAY_MS);
            }
        },
        async getAllChildren(node) {
            let currentNavigationRequest = this.openmct.objects.makeKeyString(node.object.identifier);
            this.latestNavigationRequest = currentNavigationRequest;

            await this.clearVisibleItems();
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
            await this.composition.load();

            if (currentNavigationRequest === this.latestNavigationRequest) {
                this.finishLoading();
            }
        },
        buildTreeItem(domainObject) {
            let navToParent = ROOT_PATH + this.currentNavigatedPath;
            if (navToParent === ROOT_PATH) {
                navToParent = navToParent.slice(0, -1);
            }

            return {
                id: this.openmct.objects.makeKeyString(domainObject.identifier),
                object: domainObject,
                objectPath: [domainObject].concat(this.currentObjectPath),
                navigateToParent: navToParent
            };
        },
        observeAncestors() {
            let observedAncestorIds = Object.keys(this.observedAncestors);

            // observe any ancestors, not currently being observed
            this.ancestors.forEach((ancestor) => {
                let ancestorObject = ancestor.object;
                let ancestorKeyString = this.openmct.objects.makeKeyString(ancestorObject.identifier);
                let index = observedAncestorIds.indexOf(ancestorKeyString);

                if (index !== -1) { // currently observed
                    observedAncestorIds.splice(index, 1); // remove all active ancestors from id tracking
                } else { // not observed, observe it
                    this.observeAncestor(ancestorKeyString, ancestorObject);
                }
            });

            // remove any ancestors currnetly being observed that are no longer active ancestors
            this.stopObservingAncestors(observedAncestorIds);
        },
        stopObservingAncestors(ids = Object.keys(this.observedAncestors)) {
            ids.forEach((id) => {
                this.observedAncestors[id]();
                this.observedAncestors[id] = undefined;
                delete this.observedAncestors[id];
            });
        },
        observeAncestor(id, object) {
            this.observedAncestors[id] = this.openmct.objects.observe(object, 'location',
                (location) => {
                    let ancestorObjects = this.ancestors.map(ancestor => ancestor.object);
                    // ancestor has been removed from tree, reset to it's parent
                    if (location === null) {
                        let index = ancestorObjects.indexOf(object);
                        let parentIndex = index - 1;
                        if (this.ancestors[parentIndex]) {
                            this.handleReset(this.ancestors[parentIndex]);
                        }
                    }
                });
        },
        addChild(child) {
            let item = this.buildTreeItem(child);
            this.allTreeItems.push(item);
        },
        removeChild(identifier) {
            let removeId = this.openmct.objects.makeKeyString(identifier);
            this.allTreeItems = this.allTreeItems
                .filter(c => c.id !== removeId);
            this.setContainerHeight();
        },
        finishLoading() {
            if (this.jumpPath) {
                this.jumpToPath();
            }

            this.autoScroll();
            this.isLoading = false;
            this.setContainerHeight();
        },
        async jumpToPath(saveExpandedPath = false) {
            // switching back and forth between multiple root children can cause issues,
            // this checks for one of those issues
            if (this.jumpPath.key) {
                this.jumpPath = this.jumpPath.key;
            }

            let nodes = this.jumpPath.split('/');

            for (let i = 0; i < nodes.length; i++) {
                let currentNode = await this.openmct.objects.get(nodes[i]);
                let newParent = this.buildTreeItem(currentNode);
                this.ancestors.push(newParent);
                if (!this.itemHeightCalculated) {
                    await this.calculateItemHeight();
                }

                if (i === nodes.length - 1) {
                    this.jumpPath = '';
                    this.getAllChildren(newParent);
                    if (this.afterJump) {
                        await this.$nextTick();
                        this.afterJump();
                        delete this.afterJump;
                    }

                    if (saveExpandedPath) {
                        this.setCurrentNavigatedPath();
                    }
                }
            }
        },
        async autoScroll() {
            if (!this.scrollTo) {
                return;
            }

            if (this.$refs.scrollable) {
                let indexOfScroll = this.indexOfItemById(this.scrollTo);
                let scrollTopAmount = indexOfScroll * this.itemHeight;

                await this.$nextTick();

                this.$refs.scrollable.scrollTop = scrollTopAmount;
                this.scrollTo = undefined;
            } else {
                window.setTimeout(this.autoScroll, RECHECK_DELAY);
            }
        },
        indexOfItemById(id) {
            for (let i = 0; i < this.allTreeItems.length; i++) {
                if (this.allTreeItems[i].id === id) {
                    return i;
                }
            }
        },
        async getSearchResults() {
            let results = await this.searchService.query(this.searchValue);
            this.searchResultItems = results.hits.map(result => {

                let context = result.object.getCapability('context');
                let object = result.object.useCapability('adapter');
                let objectPath = [];
                let navigateToParent;

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
                };
            });
            this.searchLoading = false;
        },
        searchTree(value) {
            this.searchValue = value;
            this.searchLoading = true;

            if (this.searchValue !== '') {
                this.getSearchResults();
            } else {
                this.searchLoading = false;
            }
        },
        searchActivated() {
            this.activeSearch = true;
            this.$refs.scrollable.scrollTop = 0;
        },
        async searchDeactivated() {
            this.activeSearch = false;
            await this.$nextTick();
            this.$refs.scrollable.scrollTop = 0;
        },
        handleReset(node) {
            this.childrenSlideClass = 'up';
            this.ancestors.splice(this.ancestors.indexOf(node) + 1);
            this.getAllChildren(node);
            this.setCurrentNavigatedPath();
        },
        handleExpanded(node) {
            this.childrenSlideClass = 'down';
            let newParent = this.buildTreeItem(node);
            this.ancestors.push(newParent);
            this.getAllChildren(newParent);
            this.setCurrentNavigatedPath();
        },
        getSavedNavigatedPath() {
            return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY__EXPANDED_TREE_NODE));
        },
        setCurrentNavigatedPath() {
            if (!this.searchValue) {
                localStorage.setItem(LOCAL_STORAGE_KEY__EXPANDED_TREE_NODE, JSON.stringify(this.currentNavigatedPath));
            }
        },
        currentPathIsActivePath() {
            return this.getSavedNavigatedPath() === this.currentlyViewedObjectParentPath();
        },
        currentlyViewedObjectId() {
            let currentPath = this.openmct.router.currentLocation.path;
            if (currentPath) {
                currentPath = currentPath.split(ROOT_PATH)[1];

                return currentPath.split('/').pop();
            }
        },
        currentlyViewedObjectParentPath() {
            let currentPath = this.openmct.router.currentLocation.path;
            if (currentPath) {
                currentPath = currentPath.split(ROOT_PATH)[1];
                currentPath = currentPath.split('/');
                currentPath.pop();

                return currentPath.join('/');
            }
        },
        async clearVisibleItems() {
            this.noVisibleItems = true;
            this.visibleItems = [];
            await this.$nextTick(); // prevents "ghost" image of visibleItems

            return;
        },
        scrollItems(event) {
            if (!windowResizing) {
                this.updateVisibleItems();
            }
        },
        childrenListStyles() {
            return { position: 'relative' };
        },
        scrollableStyles() {
            let height = this.availableContainerHeight + 'px';

            return { height };
        },
        getElementStyleValue(el, style) {
            let styleString = window.getComputedStyle(el)[style];
            let index = styleString.indexOf('px');

            return Number(styleString.slice(0, index));
        },
        backwardsCompatibilityCheck() {
            let oldTreeExpanded = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY__TREE_EXPANDED__OLD));

            if (oldTreeExpanded) {
                localStorage.removeItem(LOCAL_STORAGE_KEY__TREE_EXPANDED__OLD);
            }
        }
    }
};
</script>
