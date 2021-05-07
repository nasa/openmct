<template>
<div class="c-tree-and-search">

    <div
        ref="search"
        class="c-tree-and-search__search"
    >
        <search
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
    >
        <div>

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
        </div>

        <div
            ref="scrollable"
            class="c-tree__scrollable"
            :style="scrollableStyles()"
            @scroll="updateVisibleItems()"
        >
            <div :style="{ height: childrenHeight + 'px' }">
                <tree-item
                    v-for="(treeItem, index) in visibleItems"
                    :key="treeItem.navigationPath"
                    :node="treeItem"
                    :active-search="activeSearch"
                    :left-offset="!activeSearch ? treeItem.leftOffset : '0px'"
                    :item-offset="itemOffset"
                    :item-index="index"
                    :item-height="itemHeight"
                    :is-open="openTreeItems.includes(treeItem.navigationPath)"
                    @tree-item-destroyed="removeCompositionListenerFor($event)"
                    @navigation-click="treeItemAction(treeItem, $event)"
                />
                <!-- loading -->
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
import search from '../components/search.vue';

const ITEM_BUFFER = 5;
const LOCAL_STORAGE_KEY__TREE_EXPANDED = 'mct-tree-expanded';
const RETURN_ALL_DESCDNDANTS = true;

export default {
    name: 'MctTree',
    components: {
        search,
        treeItem
    },
    inject: ['openmct'],
    props: {
        syncTreeNavigation: {
            type: Boolean,
            required: true
        },
        resetTreeNavigation: {
            type: Boolean,
            required: true
        }
    },
    data() {
        return {
            isLoading: false,
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
            mainTreeTopMargin: undefined
        };
    },
    computed: {
        focusedItems() {
            return this.activeSearch ? this.searchResultItems : this.treeItems;
        },
        pageThreshold() {
            return Math.ceil(this.mainTreeHeight / this.itemHeight) + ITEM_BUFFER;
        },
        childrenHeight() {
            let childrenCount = this.focusedItems.length || 1;

            return (this.itemHeight * childrenCount) - this.mainTreeTopMargin; // 5px margin
        },
        showNoItems() {
            return this.visibleItems.length === 0 && !this.activeSearch && !this.isLoading;
        },
        showNoSearchResults() {
            return this.searchValue && this.searchResultItems.length === 0 && !this.searchLoading;
        }
    },
    watch: {
        syncTreeNavigation() {
            // if there is an abort controller, then a search is in progress and will need to be canceled
            if (this.abortController) {
                this.abortController.abort();
                delete this.abortController;
            }

            this.searchValue = '';

            if (!this.openmct.router.path) {
                return;
            }

            this.showCurrentPathInTree();
        },
        resetTreeNavigation() {
            console.log('reset', this.openTreeItems);
            [...this.openTreeItems].reverse().map(this.closeTreeItem);
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
        await this.syncTreeOpenItems();

        this.isLoading = false;
    },
    created() {
        this.getSearchResults = _.debounce(this.getSearchResults, 400);
        this.handleWindowResize = _.debounce(this.handleWindowResize, 500);
    },
    destroyed() {
        window.removeEventListener('resize', this.handleWindowResize);
    },
    methods: {
        async initialize() {
            this.isLoading = true;
            this.openmct.$injector.get('searchService');
            window.addEventListener('resize', this.handleWindowResize);
            this.getSavedOpenItems();

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

            this.treeItems = await this.loadAndBuildTreeItemsFor(root);
        },
        treeItemAction(parentItem, type) {
            if (type === 'close') {
                this.closeTreeItem(parentItem);
            } else {
                this.openTreeItem(parentItem);
            }
        },
        // eslint-disable-next-line object-property-newline
        async openTreeItem(parentItem, synchronous = false) {
            let childrenItems = await this.loadAndBuildTreeItemsFor(parentItem.object, parentItem.objectPath);
            let parentPath = parentItem.navigationPath;
            let parentIndex = this.treeItems.indexOf(parentItem);

            this.treeItems.splice(parentIndex + 1, 0, ...childrenItems);

            if (!this.isTreeItemOpen(parentItem)) {
                this.openTreeItems.push(parentPath);
            }

            for (let item of childrenItems) {
                if (this.isTreeItemOpen(item)) {
                    if (!synchronous) {
                        this.openTreeItem(item);
                    } else {
                        await this.openTreeItem(item, synchronous);
                    }
                }
            }

            return;
        },
        closeTreeItem(item) {
            if (typeof item === 'string') {
                item = { navigationPath: item };
            }

            let itemPath = item.navigationPath;
            let pathIndex = this.openTreeItems.indexOf(itemPath);

            function keepItem(checkItem) {
                return checkItem.navigationPath === itemPath
                    || !checkItem.navigationPath.includes(itemPath);
            }

            this.treeItems = this.treeItems.filter(keepItem);
            this.openTreeItems.splice(pathIndex, 1);
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
        async openAndScrollTo(navigationPath) {
            const SYNCHRONOUS = true;
            let pathArray = navigationPath.split('/');
            let path = '';

            // skip root
            pathArray.splice(0, 2);
            pathArray[0] = '/browse/' + pathArray[0];

            for (let i = 0; i < pathArray.length; i++) {
                path += pathArray[i];
                let item = this.getTreeItemByPath(path);

                if (item && !this.isTreeItemOpen(path)) {
                    await this.openTreeItem(item, SYNCHRONOUS);
                }

                if (this.getTreeItemByPath(navigationPath)) {
                    break;
                }

                path += '/';
            }

            this.scrollTo(navigationPath);
        },
        scrollTo(navigationPath) {
            const indexOfScroll = this.treeItems.findIndex(item => item.navigationPath === navigationPath);
            const scrollTopAmount = indexOfScroll * this.itemHeight;

            this.$refs.scrollable.scrollTo({
                top: scrollTopAmount,
                behavior: 'smooth'
            });
        },
        async loadAndBuildTreeItemsFor(domainObject, parentObjectPath = []) {
            let collection = this.openmct.composition.get(domainObject);
            let composition = await collection.load();

            if (parentObjectPath.length) {
                let navigationPath = this.buildNavigationPath(parentObjectPath);

                if (this.compositionCollections[navigationPath]) {
                    this.removeCompositionListenerFor(navigationPath);
                }

                this.compositionCollections[navigationPath] = {};
                this.compositionCollections[navigationPath].collection = collection;
                this.compositionCollections[navigationPath].addHandler = this.compositionAddHandler(navigationPath);
                this.compositionCollections[navigationPath].removeHandler = this.compositionRemoveHandler(navigationPath);

                this.compositionCollections[navigationPath].collection.on('add',
                    this.compositionCollections[navigationPath].addHandler);
                this.compositionCollections[navigationPath].collection.on('remove',
                    this.compositionCollections[navigationPath].removeHandler);
            }

            return composition.map((object) => {
                return this.buildTreeItem(object, parentObjectPath);
            });
        },
        buildTreeItem(domainObject, parentObjectPath) {
            let objectPath = [domainObject].concat(parentObjectPath);
            let navigationPath = this.buildNavigationPath(objectPath);

            return {
                id: this.openmct.objects.makeKeyString(domainObject.identifier),
                object: domainObject,
                leftOffset: ((objectPath.length - 1) * 10) + 'px',
                objectPath,
                navigationPath
            };
        },
        buildNavigationPath(objectPath) {
            return '/browse/' + [...objectPath].reverse()
                .map((object) => this.openmct.objects.makeKeyString(object.identifier))
                .join('/');
        },
        compositionAddHandler(navigationPath) {
            return (domainObject) => {
                let parentItem = this.getTreeItemByPath(navigationPath);
                let newItem = this.buildTreeItem(domainObject, parentItem.objectPath);
                let allDescendants = this.getChildrenInTreeFor(parentItem, RETURN_ALL_DESCDNDANTS);
                let afterItem = allDescendants.length ? allDescendants.pop() : parentItem;

                this.addItemToTreeAfter(newItem, afterItem);
            };
        },
        compositionRemoveHandler(navigationPath) {
            return (identifier) => {
                let removeKeyString = this.openmct.objects.makeKeyString(identifier);
                let parentItem = this.getTreeItemByPath(navigationPath);
                let directDescendants = this.getChildrenInTreeFor(parentItem);
                let removeItem = directDescendants.find(item => item.id === removeKeyString);

                this.removeItemFromTree(removeItem);
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
        addItemToTreeAfter(addItem, afterItem) {
            const addIndex = this.getTreeItemIndex(afterItem.navigationPath);
            this.treeItems.splice(addIndex + 1, 0, addItem);

            if (this.isTreeItemOpen(addItem)) {
                this.openTreeItem(addItem);
            }

            return;
        },
        searchTree(value) {
            // if an abort controller exists, regardless of the value passed in,
            // there is an active search that should be cancled
            if (this.abortController) {
                this.abortController.abort();
                delete this.abortController;
            }

            this.searchValue = value;
            this.searchLoading = true;

            if (this.searchValue !== '') {
                this.getSearchResults();
            } else {
                this.searchLoading = false;
            }
        },
        getSearchResults() {
            // clear any previous search results
            this.searchResultItems = [];

            // an abort controller will be passed in that will be used
            // to cancel an active searches if necessary
            this.abortController = new AbortController();
            const abortSignal = this.abortController.signal;

            const promises = this.openmct.objects.search(this.searchValue, abortSignal)
                .map(promise => promise
                    .then(results => this.aggregateSearchResults(results, abortSignal)));

            Promise.all(promises).then(() => {
                this.searchLoading = false;
            }).catch(reason => {
                // search aborted
            }).finally(() => {
                if (this.abortController) {
                    delete this.abortController;
                }
            });
        },
        aggregateSearchResults(results, abortSignal) {
            for (const result of results) {
                if (!abortSignal.aborted) {
                    this.openmct.objects.getOriginalPath(result.identifier).then((objectPath) => {
                        // removing the item itself, as the path we pass to buildTreeItem is a parent path
                        objectPath.shift();

                        // if root, remove, we're not using in object path for tree
                        let lastObject = objectPath.length ? objectPath[objectPath.length - 1] : false;
                        if (lastObject && lastObject.type === 'root') {
                            objectPath.pop();
                        }

                        this.searchResultItems.push(this.buildTreeItem(result, objectPath));
                    });
                }
            }
        },
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
        calculateHeights() {
            const RECHECK = 100;

            return new Promise((resolve, reject) => {

                let checkHeights = () => {
                    let treeTopMargin = this.getElementStyleValue(this.$refs.mainTree, 'marginTop');
                    if (
                        this.$el
                        && this.$refs.search
                        && this.$refs.mainTree
                        && this.$refs.dummyItem
                        && this.$el.offsetHeight !== 0
                        && treeTopMargin > 0
                    ) {
                        this.mainTreeTopMargin = treeTopMargin;
                        this.mainTreeHeight = this.$el.offsetHeight
                            - this.$refs.search.offsetHeight
                            - this.mainTreeTopMargin;
                        this.itemHeight = this.getElementStyleValue(this.$refs.dummyItem, 'height');

                        resolve();
                    } else {
                        setTimeout(checkHeights, RECHECK);
                    }
                };

                checkHeights();
            });
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
        isTreeItemOpen(item) {
            if (typeof item === 'string') {
                item = { navigationPath: item };
            }

            return this.openTreeItems.includes(item.navigationPath);
        },
        childrenListStyles() {
            return { position: 'relative' };
        },
        scrollableStyles() {
            let height = this.mainTreeHeight + 'px';

            return { height };
        },
        getElementStyleValue(el, style) {
            if (!el) {
                return;
            }

            let styleString = window.getComputedStyle(el)[style];
            let index = styleString.indexOf('px');

            return Number(styleString.slice(0, index));
        },
        getSavedOpenItems() {
            let openItems = localStorage.getItem(LOCAL_STORAGE_KEY__TREE_EXPANDED);
            this.openTreeItems = openItems ? JSON.parse(openItems) : [];
        },
        setSavedOpenItems() {
            localStorage.setItem(LOCAL_STORAGE_KEY__TREE_EXPANDED, JSON.stringify(this.openTreeItems));
        },
        handleWindowResize() {
            this.calculateHeights();
        }
    }
};
</script>
