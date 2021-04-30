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
                    @expanded="treeItemAction(treeItem)"
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
const TRACK_OPEN_STATE = true;

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
        },
        showNavTreeContainer() {
            return !this.isLoading && !this.searchLoading;
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
            this.openTreeItems = [];
            this.loadRoot();
        },
        searchValue() {
            if (this.searchValue !== '' && !this.activeSearch) {
                this.activeSearch = true;
                this.$refs.scrollable.scrollTop = 0;
                this.skipScroll = true;
            } else if (this.searchValue === '') {
                this.activeSearch = false;
                this.skipScroll = false;
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

            let rootCompositionCollection = this.openmct.composition.get(root);
            let rootComposition = await rootCompositionCollection.load();

            this.treeItems = rootComposition.map((domainObject) => {
                return this.buildTreeItem(domainObject, []);
            });
        },
        treeItemAction(parentItem) {
            const parentOpen = this.openTreeItems.includes(parentItem.navigationPath);

            if (parentOpen) {
                this.closeTreeItem(parentItem);
            } else {
                this.openTreeItem(parentItem, TRACK_OPEN_STATE);
            }
        },
        closeTreeItem(item) {
            let itemOpenId = item.navigationPath;
            let openIdIndex = this.openTreeItems.indexOf(itemOpenId);

            function keepItem(checkItem) {
                return checkItem.navigationPath === itemOpenId
                    || !checkItem.navigationPath.includes(itemOpenId);
            }

            this.treeItems = this.treeItems.filter(keepItem);
            this.openTreeItems.splice(openIdIndex, 1);
        },
        async openTreeItem(parentItem, trackOpenState = false) {
            let parentOpenId = parentItem.navigationPath;
            let parentIndex = this.treeItems.indexOf(parentItem);
            let compositionCollection = this.openmct.composition.get(parentItem.object);
            let children = await compositionCollection.load();

            children = children.reverse();

            for (let domainObject of children) {
                let childTreeItem = this.buildTreeItem(domainObject, parentItem.objectPath);

                this.treeItems.splice(parentIndex + 1, 0, childTreeItem);

                if (this.openTreeItems.includes(childTreeItem.navigationPath)) {
                    await this.openTreeItem(childTreeItem);
                }
            }

            if (trackOpenState) {
                this.openTreeItems.push(parentOpenId);
            }
        },
        showCurrentPathInTree() {
            let routerPath = [...this.openmct.router.path].reverse();
            const currentPath = '/browse/' + routerPath
                .map((object) => this.openmct.objects.makeKeyString(object.identifier))
                .join('/');

            if (this.getTreeItemByPath(currentPath)) {
                console.log('item in tree, scroll');
                this.scrollTo(currentPath);
            } else {
                this.openAndNavigateTo(currentPath);
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
        scrollTo(navigationPath) {
            const indexOfScroll = this.treeItems.findIndex(item => item.navigationPath === navigationPath);
            const scrollTopAmount = indexOfScroll * this.itemHeight;

            this.$refs.scrollable.scrollTo({
                top: scrollTopAmount,
                behavior: 'smooth'
            });
        },
        async openAndNavigateTo(navigationPath) {
            const pathArray = navigationPath.split('/');
            let path = '';
            pathArray.splice(0, 2);
            pathArray[0] = '/browse/' + pathArray[0];

            for (let i = 0; i < pathArray.length; i++) {
                path += pathArray[i];
                let item = this.getTreeItemByPath(path);

                if (item && !this.isTreeItemOpen(item)) {
                    await this.openTreeItem(item, TRACK_OPEN_STATE);
                }

                if (this.getTreeItemByPath(navigationPath)) {
                    break;
                }

                path += '/';
            }

            this.scrollTo(navigationPath);
        },
        handleWindowResize() {
            this.calculateHeights();
        },
        getTreeItemByPath(path) {
            return this.treeItems.find(item => item.navigationPath === path);
        },
        isTreeItemOpen(item) {
            if (typeof item === 'string') {
                item = { navigationPath: item };
            }

            return this.openTreeItems.includes(item.navigationPath);
        },
        buildTreeItem(domainObject, parentObjectPath) {
            let objectPath = [domainObject].concat(parentObjectPath);
            let navigationPath = '/browse/' + [...objectPath].reverse()
                .map((object) => this.openmct.objects.makeKeyString(object.identifier))
                .join('/');

            return {
                id: this.openmct.objects.makeKeyString(domainObject.identifier),
                object: domainObject,
                leftOffset: ((objectPath.length - 1) * 10) + 'px',
                objectPath,
                navigationPath
            };
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
        getSavedOpenItems() {
            let openItems = localStorage.getItem(LOCAL_STORAGE_KEY__TREE_EXPANDED);
            this.openTreeItems = openItems ? JSON.parse(openItems) : [];
        },
        setSavedOpenItems() {
            localStorage.setItem(LOCAL_STORAGE_KEY__TREE_EXPANDED, JSON.stringify(this.openTreeItems));
        }
    }
};
</script>
