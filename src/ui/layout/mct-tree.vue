<template>
<div
    ref="treeContainer"
    class="c-tree-and-search"
    :class="{
        'c-selector': isSelectorTree
    }"
>
    <div
        ref="search"
        class="c-tree-and-search__search"
    >
        <search
            v-show="isSelectorTree"
            ref="shell-search"
            class="c-search"
            :value="searchValue"
            @input="searchTree"
            @clear="searchTree"
        />
    </div>

    <!-- search loading -->
    <div
        v-if="searchLoading && activeSearch"
        class="c-tree__item c-tree-and-search__loading loading"
    >
        <span class="c-tree__item__label">Searching...</span>
    </div>

    <!-- no results -->
    <div
        v-if="showNoSearchResults"
        class="c-tree-and-search__no-results"
    >
        No results found
    </div>

    <!-- main tree -->
    <div
        ref="mainTree"
        class="c-tree-and-search__tree c-tree"
        role="tree"
        aria-expanded="true"
    >

        <div
            ref="dummyItem"
            class="c-tree__item-h"
            style="left: -1000px; position: absolute; visibility: hidden"
        >
            <div class="c-tree__item">
                <span class="c-tree__item__view-control c-nav__up is-enabled"></span>
                <a
                    class="c-tree__item__label c-object-label"
                    draggable="true"
                    href="#"
                >
                    <div class="c-tree__item__type-icon c-object-label__type-icon icon-folder">
                        <span title="Open MCT"></span>
                    </div>
                    <div class="c-tree__item__name c-object-label__name">
                        Open MCT
                    </div>
                </a>
                <span class="c-tree__item__view-control c-nav__down"></span>
            </div>
        </div>

        <div
            ref="scrollable"
            class="c-tree__scrollable"
            :style="scrollableStyles"
            @scroll="updateVisibleItems()"
        >
            <div :style="childrenHeightStyles">
                <tree-item
                    v-for="(treeItem, index) in visibleItems"
                    :key="`${treeItem.navigationPath}-${index}`"
                    :node="treeItem"
                    :is-selector-tree="isSelectorTree"
                    :selected-item="selectedItem"
                    :active-search="activeSearch"
                    :left-offset="!activeSearch ? treeItem.leftOffset : '0px'"
                    :is-new="treeItem.isNew"
                    :item-offset="itemOffset"
                    :item-index="index"
                    :item-height="itemHeight"
                    :open-items="openTreeItems"
                    :loading-items="treeItemLoading"
                    @tree-item-mounted="scrollToCheck($event)"
                    @tree-item-destroyed="removeCompositionListenerFor($event)"
                    @tree-item-action="treeItemAction(treeItem, $event)"
                    @tree-item-selection="treeItemSelection(treeItem)"
                />
                <!-- main loading -->
                <div
                    v-if="isLoading"
                    class="c-tree__item c-tree-and-search__loading loading"
                >
                    <span class="c-tree__item__label">Loading...</span>
                </div>
                <!-- end loading -->
                <div
                    v-if="showNoItems"
                    class="c-tree__item c-tree__item--empty"
                >
                    No items
                </div>
            </div>
        </div>
    </div>
    <!-- end main tree -->

</div>
</template>

<script>
import _ from 'lodash';
import treeItem from './tree-item.vue';
import treeMixin from '../mixins/tree-mixin.js';
import search from '../components/search.vue';

const ITEM_BUFFER = 25;
const LOCAL_STORAGE_KEY__TREE_EXPANDED = 'mct-tree-expanded';
const TREE_ITEM_INDENT_PX = 18;
const SORT_MY_ITEMS_ALPH_ASC = true;
const LOCATOR_ITEM_COUNT_HEIGHT = 10; // how many tree items to make the locator selection box show

export default {
    name: 'MctTree',
    components: {
        search,
        treeItem
    },
    mixins: [treeMixin],
    inject: ['openmct'],
    props: {
        isSelectorTree: {
            type: Boolean,
            required: false,
            default() {
                return false;
            }
        },
        initialSelection: {
            type: Object,
            required: false,
            default() {
                return {};
            }
        },
        syncTreeNavigation: {
            type: Boolean,
            required: false
        },
        resetTreeNavigation: {
            type: Boolean,
            required: false
        }
    },
    data() {
        return {
            isLoading: false,
            treeItemLoading: {},
            mainTreeHeight: undefined,
            searchLoading: false,
            searchValue: '',
            treeItems: [],
            openTreeItems: [],
            compositionCollections: {},
            searchResultItems: [],
            visibleItems: [],
            updatingView: false,
            itemHeight: 27,
            itemOffset: 0,
            activeSearch: false,
            mainTreeTopMargin: undefined,
            selectedItem: {}
        };
    },
    computed: {
        childrenHeight() {
            let childrenCount = this.focusedItems.length || 1;

            return (this.itemHeight * childrenCount) - this.mainTreeTopMargin; // 5px margin
        },
        childrenHeightStyles() {
            let height = this.childrenHeight + 'px';

            return { height };
        },
        focusedItems() {
            return this.activeSearch ? this.searchResultItems : this.treeItems;
        },
        pageThreshold() {
            return Math.ceil(this.mainTreeHeight / this.itemHeight) + ITEM_BUFFER;
        },
        scrollableStyles() {
            let height = this.mainTreeHeight + 'px';

            return { height };
        },
        showNoItems() {
            return this.visibleItems.length === 0 && !this.activeSearch && this.searchValue === '' && !this.isLoading;
        },
        showNoSearchResults() {
            return this.searchValue && this.searchResultItems.length === 0 && !this.searchLoading;
        },
        treeHeight() {
            if (!this.isSelectorTree) {
                return {};
            } else {
                return { 'min-height': this.itemHeight * LOCATOR_ITEM_COUNT_HEIGHT + 'px' };
            }
        }
    },
    watch: {
        resetTreeNavigation() {
            [...this.openTreeItems].reverse().map(this.closeTreeItemByPath);
        },
        searchValue() {
            if (this.searchValue !== '' && !this.activeSearch) {
                this.activeSearch = true;
                this.$refs.scrollable.scrollTop = 0;
            } else if (this.searchValue === '') {
                this.activeSearch = false;
            }
        },
        mainTreeHeight() {
            this.updateVisibleItems();
        },
        focusedItems() {
            this.updateVisibleItems();
        },
        openTreeItems() {
            this.setSavedOpenItems();
        }
    },
    async mounted() {
        await this.initialize();
        await this.loadRoot();
        this.isLoading = false;

        if (!this.isSelectorTree) {
            await this.syncTreeOpenItems();
        } else {
            if (this.initialSelection.identifier) {
                const objectPath = await this.openmct.objects.getOriginalPath(this.initialSelection.identifier);
                const navigationPath = this.buildNavigationPath(objectPath);

                this.openAndScrollTo(navigationPath);
            }
        }
    },
    created() {
        this.getSearchResults = _.debounce(this.getSearchResults, 400);
        this.handleTreeResize = _.debounce(this.handleTreeResize, 300);
        this.scrollEndEvent = _.debounce(this.scrollEndEvent, 100);
    },
    destroyed() {
        if (this.treeResizeObserver) {
            this.treeResizeObserver.disconnect();
        }

        this.destroyObservers();
        this.destroyMutables();
    },
    methods: {
        async initialize() {
            this.observers = {};
            this.mutables = {};
            this.isLoading = true;
            this.getSavedOpenItems();
            this.treeResizeObserver = new ResizeObserver(this.handleTreeResize);
            this.treeResizeObserver.observe(this.$el);

            await this.calculateHeights();

            return;
        },
        async loadRoot() {
            this.treeItems = [];
            const root = await this.openmct.objects.get('ROOT');

            if (!root.identifier) {
                return false;
            }

            // will need to listen for root composition changes as well

            this.treeItems = await this.loadAndBuildTreeItemsFor(root, []);
        },
        treeItemAction(parentItem, type) {
            if (type === 'close') {
                this.closeTreeItem(parentItem);
            } else {
                this.openTreeItem(parentItem);
            }
        },
        treeItemSelection(item) {
            this.selectedItem = item;
            this.$emit('tree-item-selection', item);
        },
        async openTreeItem(parentItem) {
            let parentPath = parentItem.navigationPath;

            this.startItemLoad(parentPath);
            // pass in abort signal when functional
            let childrenItems = await this.loadAndBuildTreeItemsFor(parentItem.object, parentItem.objectPath);
            let parentIndex = this.treeItems.indexOf(parentItem);

            // if it's not loading, it was aborted
            if (!this.isItemLoading(parentPath) || parentIndex === -1) {
                return;
            }

            this.endItemLoad(parentPath);

            this.treeItems.splice(parentIndex + 1, 0, ...childrenItems);

            if (!this.isTreeItemOpen(parentItem)) {
                this.openTreeItems.push(parentPath);
            }

            for (let item of childrenItems) {
                if (this.isTreeItemOpen(item)) {
                    this.openTreeItem(item);
                }
            }

            return;
        },
        showCurrentPathInTree() {
            const currentPath = this.buildNavigationPath(this.openmct.router.path);

            if (this.getTreeItemByPath(currentPath)) {
                this.scrollTo(currentPath);
            } else {
                this.openAndScrollTo(currentPath);
            }
        },
        async syncTreeOpenItems() {
            const items = [...this.treeItems];

            for (let item of items) {
                if (this.isTreeItemOpen(item)) {
                    await this.openTreeItem(item);
                }
            }
        },
        openAndScrollTo(navigationPath) {
            if (navigationPath.includes('/ROOT')) {
                navigationPath = navigationPath.split('/ROOT').join('');
            }

            let idArray = navigationPath.split('/');
            let fullPathArray = [];
            let pathsToOpen;

            this.scrollToPath = navigationPath;

            // skip root
            idArray.splice(0, 2);
            idArray[0] = 'browse/' + idArray[0];
            idArray.reduce((parentPath, childPath) => {
                let fullPath = [parentPath, childPath].join('/');

                fullPathArray.push(fullPath);

                return fullPath;
            }, '');

            pathsToOpen = fullPathArray.filter(fullPath => !this.isTreeItemPathOpen(fullPath) && fullPath !== navigationPath);

            pathsToOpen.reduce(async (parentLoaded, childPath) => {
                await parentLoaded;

                return this.openTreeItem(this.getTreeItemByPath(childPath));

            }, Promise.resolve()).then(() => {
                if (this.isSelectorTree) {
                    // If item is missing due to error in object creation,
                    // walk up the navigationPath until we find an item
                    let item = this.getTreeItemByPath(navigationPath);
                    while (!item) {
                        const startIndex = 0;
                        const endIndex = navigationPath.lastIndexOf('/');
                        navigationPath = navigationPath.substring(startIndex, endIndex);
                        item = this.getTreeItemByPath(navigationPath);
                    }

                    this.treeItemSelection(item);
                }
            });
        },
        scrollToCheck(navigationPath) {
            if (this.scrollToPath && this.scrollToPath === navigationPath) {
                this.scrollTo(navigationPath);
            }
        },
        scrollTo(navigationPath) {

            if (!this.$refs.scrollable || this.isItemInView(navigationPath)) {
                return;
            }

            const indexOfScroll = this.treeItems.findIndex(item => item.navigationPath === navigationPath);

            if (indexOfScroll !== -1) {
                const scrollTopAmount = indexOfScroll * this.itemHeight;

                this.$refs.scrollable.scrollTo({
                    top: scrollTopAmount,
                    behavior: 'smooth'
                });
            } else if (this.scrollToPath) {
                this.scrollToPath = undefined;
                delete this.scrollToPath;
            }
        },
        scrollEndEvent() {
            if (!this.$refs.scrollable) {
                return;
            }

            this.$nextTick(() => {
                if (this.scrollToPath) {
                    if (!this.isItemInView(this.scrollToPath)) {
                        this.scrollTo(this.scrollToPath);
                    } else {
                        this.scrollToPath = undefined;
                        delete this.scrollToPath;
                    }
                }
            });
        },
        isItemInView(navigationPath) {
            const indexOfScroll = this.treeItems.findIndex(item => item.navigationPath === navigationPath);
            const scrollTopAmount = indexOfScroll * this.itemHeight;
            const treeStart = this.$refs.scrollable.scrollTop;
            const treeEnd = treeStart + this.mainTreeHeight;

            return scrollTopAmount >= treeStart && scrollTopAmount < treeEnd;
        },
        getLowercaseObjectName(domainObject) {
            let objectName;
            if (!domainObject) {
                return objectName;
            }

            if (domainObject.name) {
                objectName = domainObject.name.toLowerCase();
            }

            if (domainObject.object && domainObject.object.name) {
                objectName = domainObject.object.name.toLowerCase();
            }

            return objectName;
        },
        sortNameAscending(a, b) {
            // sorting tree children items
            let objectAName = this.getLowercaseObjectName(a);
            let objectBName = this.getLowercaseObjectName(b);
            if (!objectAName || !objectBName) {
                return 0;
            }

            // sorting composition items
            if (objectAName > objectBName) {
                return 1;
            }

            if (objectBName > objectAName) {
                return -1;
            }

            return 0;
        },
        isSortable(parentObjectPath) {
            // determine if any part of the parent's path includes a key value of mine; aka My Items
            return Boolean(parentObjectPath.find(path => path.identifier.key === 'mine'));
        },
        addTreeItemObserver(domainObject, parentObjectPath) {
            const objectPath = [domainObject].concat(parentObjectPath);
            const navigationPath = this.buildNavigationPath(objectPath);

            if (this.observers[navigationPath]) {
                this.observers[navigationPath]();
            }

            this.observers[navigationPath] = this.openmct.objects.observe(
                domainObject,
                'name',
                this.sortTreeItems.bind(this, parentObjectPath)
            );
        },
        sortTreeItems(parentObjectPath) {
            const navigationPath = this.buildNavigationPath(parentObjectPath);
            const parentItem = this.getTreeItemByPath(navigationPath);

            // If the parent is not sortable, skip sorting
            if (!this.isSortable(parentObjectPath)) {
                return;
            }

            // Sort the renamed object and its siblings (direct descendants of the parent)
            const directDescendants = this.getChildrenInTreeFor(parentItem, false);
            directDescendants.sort(this.sortNameAscending);

            // Take a copy of the sorted descendants array
            const sortedTreeItems = directDescendants.slice();

            directDescendants.forEach(descendant => {
                const parent = this.getTreeItemByPath(descendant.navigationPath);

                // If descendant is not open, skip
                if (!this.isTreeItemOpen(parent)) {
                    return;
                }

                // If descendant is open but has no children, skip
                const children = this.getChildrenInTreeFor(parent, true);
                if (children.length === 0) {
                    return;
                }

                // Splice in the children of the descendant
                const parentIndex = sortedTreeItems.map(item => item.navigationPath).indexOf(parent.navigationPath);
                sortedTreeItems.splice(parentIndex + 1, 0, ...children);
            });

            // Splice in all of the sorted descendants
            this.treeItems.splice(this.treeItems.indexOf(parentItem) + 1, sortedTreeItems.length, ...sortedTreeItems);
        },
        compositionAddHandler(navigationPath) {
            return (domainObject) => {
                const parentItem = this.getTreeItemByPath(navigationPath);
                const newItem = this.buildTreeItem(domainObject, parentItem.objectPath, true);
                const descendants = this.getChildrenInTreeFor(parentItem, true);
                const directDescendants = this.getChildrenInTreeFor(parentItem);

                if (domainObject.isMutable) {
                    this.addMutable(domainObject, parentItem.objectPath);
                }

                this.addTreeItemObserver(domainObject, parentItem.objectPath);

                if (directDescendants.length === 0) {
                    this.addItemToTreeAfter(newItem, parentItem);

                    return;
                }

                if (SORT_MY_ITEMS_ALPH_ASC && this.isSortable(parentItem.objectPath)) {
                    const newItemIndex = directDescendants
                        .findIndex(descendant => this.sortNameAscending(descendant, newItem) > 0);
                    const shouldInsertFirst = newItemIndex === 0;
                    const shouldInsertLast = newItemIndex === -1;

                    if (shouldInsertFirst) {
                        this.addItemToTreeAfter(newItem, parentItem);
                    } else if (shouldInsertLast) {
                        this.addItemToTreeAfter(newItem, descendants.pop());
                    } else {
                        this.addItemToTreeBefore(newItem, directDescendants[newItemIndex]);
                    }

                    return;
                }

                this.addItemToTreeAfter(newItem, descendants.pop());
            };
        },
        compositionRemoveHandler(navigationPath) {
            return (identifier) => {
                const removeKeyString = this.openmct.objects.makeKeyString(identifier);
                const parentItem = this.getTreeItemByPath(navigationPath);
                const directDescendants = this.getChildrenInTreeFor(parentItem);
                const removeItem = directDescendants.find(item => item.id === removeKeyString);

                // Remove the item from the tree, unobserve it, and clean up any mutables
                this.removeItemFromTree(removeItem);
                this.destroyObserverByPath(removeItem.navigationPath);
                this.destroyMutableByPath(removeItem.navigationPath);
            };
        },
        removeCompositionListenerFor(navigationPath) {
            if (this.compositionCollections[navigationPath]) {
                this.compositionCollections[navigationPath].collection.off('add',
                    this.compositionCollections[navigationPath].addHandler);
                this.compositionCollections[navigationPath].collection.off('remove',
                    this.compositionCollections[navigationPath].removeHandler);

                this.compositionCollections[navigationPath] = undefined;
                delete this.compositionCollections[navigationPath];
            }
        },
        removeItemFromTree(item) {
            if (this.isTreeItemOpen(item)) {
                this.closeTreeItem(item);
            }

            const removeIndex = this.getTreeItemIndex(item.navigationPath);
            this.treeItems.splice(removeIndex, 1);
        },
        addItemToTreeBefore(addItem, beforeItem) {
            const addIndex = this.getTreeItemIndex(beforeItem.navigationPath);

            this.addItemToTree(addItem, addIndex);
        },
        addItemToTreeAfter(addItem, afterItem) {
            const addIndex = this.getTreeItemIndex(afterItem.navigationPath);

            this.addItemToTree(addItem, addIndex + 1);
        },
        addItemToTree(addItem, index) {
            this.treeItems.splice(index, 0, addItem);

            if (this.isTreeItemOpen(addItem)) {
                this.openTreeItem(addItem);
            }
        },
        searchTree(value) {
            // if an abort controller exists, regardless of the value passed in,
            // there is an active search that should be canceled
            if (this.abortSearchController) {
                this.abortSearchController.abort();
                delete this.abortSearchController;
            }

            this.searchValue = value;
            this.searchLoading = true;

            if (this.searchValue !== '') {
                // clear any previous search results
                this.searchResultItems = [];

                this.getSearchResults();
            } else {
                this.searchLoading = false;
            }
        },
        getSearchResults() {
            // an abort controller will be passed in that will be used
            // to cancel an active searches if necessary
            this.abortSearchController = new AbortController();
            const abortSignal = this.abortSearchController.signal;
            const searchPromises = this.openmct.objects.search(this.searchValue, abortSignal);

            searchPromises.map(promise => promise
                .then(results => {
                    this.aggregateSearchResults(results, abortSignal);
                }
                ));

            Promise.all(searchPromises).catch(reason => {
                // search aborted
            }).finally(() => {
                this.searchLoading = false;

                if (this.abortSearchController) {
                    delete this.abortSearchController;
                }
            });
        },
        aggregateSearchResults(results, abortSignal) {
            let resultPromises = [];

            for (const result of results) {
                if (!abortSignal.aborted) {
                    // Don't show deleted objects in search results
                    if (result.location === null) {
                        continue;
                    }

                    resultPromises.push(this.openmct.objects.getOriginalPath(result.identifier).then((objectPath) => {
                        // removing the item itself, as the path we pass to buildTreeItem is a parent path
                        objectPath.shift();

                        // if root, remove, we're not using in object path for tree
                        const lastObject = objectPath.length ? objectPath[objectPath.length - 1] : false;
                        if (lastObject && lastObject.type === 'root') {
                            objectPath.pop();
                        }

                        this.searchResultItems.push(this.buildTreeItem(result, objectPath));
                    }));
                }
            }

            return resultPromises;
        },
        updateVisibleItems() {
            this.scrollEndEvent();

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
                this.updatingView = false;
            });
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
        getTreeItemByPath(path) {
            return this.treeItems.find(item => item.navigationPath === path);
        },
        getTreeItemIndex(indexItem) {
            let path = typeof indexItem === 'string' ? indexItem : indexItem.navigationPath;

            return this.treeItems.findIndex(item => item.navigationPath === path);
        },
        getChildrenInTreeFor(parent, allDescendants = false) {
            const parentPath = typeof parent === 'string' ? parent : parent.navigationPath;
            const parentDepth = parentPath.split('/').length;

            return this.treeItems.filter((childItem) => {
                const childDepth = childItem.navigationPath.split('/').length;
                if (!allDescendants && childDepth > parentDepth + 1) {
                    return false;
                }

                return childItem.navigationPath !== parentPath
                && childItem.navigationPath.includes(parentPath);
            });
        },
        getSavedOpenItems() {
            if (this.isSelectorTree) {
                return;
            }

            let openItems = localStorage.getItem(LOCAL_STORAGE_KEY__TREE_EXPANDED);
            this.openTreeItems = openItems ? JSON.parse(openItems) : [];
        },
        setSavedOpenItems() {
            if (this.isSelectorTree) {
                return;
            }

            localStorage.setItem(LOCAL_STORAGE_KEY__TREE_EXPANDED, JSON.stringify(this.openTreeItems));
        },
        /**
         * Destroy an observer for the given navigationPath.
         */
        destroyObserverByPath(navigationPath) {
            if (this.observers[navigationPath]) {
                this.observers[navigationPath]();
                delete this.observers[navigationPath];
            }
        },
        /**
         * Destroy all observers.
         */
        destroyObservers() {
            Object.entries(this.observers).forEach(([key, unobserve]) => {
                if (unobserve) {
                    unobserve();
                }

                delete this.observers[key];
            });
        },
        /**
         * Destroy a mutable for the given navigationPath.
         */
        destroyMutableByPath(navigationPath) {
            if (this.mutables[navigationPath]) {
                this.mutables[navigationPath]();
                delete this.mutables[navigationPath];
            }
        },
        /**
         * Destroy all mutables.
         */
        destroyMutables() {
            Object.entries(this.mutables).forEach(([key, destroyMutable]) => {
                if (destroyMutable) {
                    destroyMutable();
                }

                delete this.mutables[key];
            });
        }
    }
};
</script>
