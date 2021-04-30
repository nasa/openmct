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
        <!-- ancestors -->
        <div v-if="!activeSearch">

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
            <!-- loading -->
            <div
                v-if="isLoading"
                class="c-tree__item c-tree-and-search__loading loading"
            >
                <span class="c-tree__item__label">Loading...</span>
            </div>
            <!-- end loading -->
        </div>

        <!-- currently viewed children -->
        <div
            v-if="showChildContainer"
            :style="childrenListStyles()"
            :class="childrenSlideClass"
        >
            <div
                ref="scrollable"
                class="c-tree__scrollable-children"
                :style="scrollableStyles()"
                @scroll="updateVisibleItems()"
            >
                <div :style="{ height: childrenHeight + 'px' }">
                    <tree-item
                        v-for="(treeItem, index) in visibleItems"
                        :key="treeItem.navigationPath"
                        :node="treeItem"
                        :left-offset="treeItem.leftOffset"
                        :item-offset="itemOffset"
                        :item-index="index"
                        :item-height="itemHeight"
                        :is-open="openTreeItems.includes(treeItem.navigationPath)"
                        @expanded="treeItemAction(treeItem)"
                    />
                    <div
                        v-if="showNoItems"
                        class="c-tree__item c-tree__item--empty"
                    >
                        No items
                    </div>
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
        }
    },
    data() {
        return {
            root: undefined,
            initialLoad: false,
            isLoading: false,
            mainTreeHeight: undefined,
            searchLoading: false,
            searchValue: '',
            treeItems: [],
            openTreeItems: [],
            searchResultItems: [],
            visibleItems: [],
            ancestors: [],
            tempAncestors: [],
            childrenSlideClass: 'down',
            updatingView: false,
            itemHeight: 27,
            itemOffset: 0,
            activeSearch: false,
            observedAncestors: {},
            mainTreeTopMargin: undefined
        };
    },
    computed: {
        focusedItems() {
            return this.activeSearch ? this.searchResultItems : this.treeItems;
        },
        pageThreshold() {
            return Math.ceil(this.availableContainerHeight / this.itemHeight) + ITEM_BUFFER;
        },
        childrenHeight() {
            let childrenCount = this.focusedItems.length || 1;

            return (this.itemHeight * childrenCount) - this.mainTreeTopMargin; // 5px margin
        },
        availableContainerHeight() {
            // return this.mainTreeHeight - this.ancestorsHeight;
            return this.mainTreeHeight;
        },
        showNoItems() {
            return this.visibleItems.length === 0 && !this.activeSearch && !this.isLoading;
        },
        showNoSearchResults() {
            return this.searchValue && this.searchResultItems.length === 0 && !this.searchLoading;
        },
        showChildContainer() {
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

            let routerPath = [...this.openmct.router.path].reverse();
            const currentPath = '/browse/' + routerPath
                .map((object) => this.openmct.objects.makeKeyString(object.identifier))
                .join('/');

            if (this.treeItems.find(item => item.navigationPath === currentPath)) {
                this.scrollTo(currentPath);
            } else {
                // need to open up the path to this item (do we close all others?)
            }
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
        availableContainerHeight() {
            this.updateVisibleItems();
        },
        focusedItems() {
            this.updateVisibleItems();
        },
        openTreeItems() {
            // save open tree items
        }
    },
    async mounted() {
        await this.initialize();

        let rootComposition = await this.loadRoot();

        this.treeItems = rootComposition.map((domainObject) => {
            return this.buildTreeItem(domainObject, { objectPath: [] });
        });

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
            // load open tree items
            await this.calculateHeights();

            return;
        },
        async loadRoot() {
            this.root = await this.openmct.objects.get('ROOT');

            if (!this.root.identifier) {
                return false;
            }

            let rootCompositionCollection = this.openmct.composition.get(this.root);
            let rootComposition = await rootCompositionCollection.load();

            return rootComposition;
        },
        treeItemAction(parentItem) {
            const parentOpen = this.openTreeItems.includes(parentItem.navigationPath);

            if (parentOpen) {
                this.closeTreeItem(parentItem);
            } else {
                const TRACK_OPEN_STATE = true;
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
                let childTreeItem = this.buildTreeItem(domainObject, parentItem);

                this.treeItems.splice(parentIndex + 1, 0, childTreeItem);

                if (this.openTreeItems.includes(childTreeItem.navigationPath)) {
                    await this.openTreeItem(childTreeItem);
                }
            }

            if (trackOpenState) {
                this.openTreeItems.push(parentOpenId);
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
            console.log('index');
            const scrollTopAmount = indexOfScroll * this.itemHeight;
            console.log('scroll top', scrollTopAmount);
            this.$refs.scrollable.scrollTo({
                top: scrollTopAmount,
                behavior: 'smooth'
            });
        },
        handleWindowResize() {
            this.calculateHeights();
        },
        // // domainObject: we're building a tree item for this
        // // objects: domainObject array up to parent of domainObject, excluding domainObject for item being built
        // buildTreeItem(domainObject, objects) {
        buildTreeItem(domainObject, parentTreeItem) {
            let objectPath = [domainObject].concat(parentTreeItem.objectPath);
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

                        // we reverse the objectPath in the tree, so have to do it here first,
                        // since this one is already in the correct direction
                        let resultObject = this.buildTreeItem(result, objectPath.reverse());

                        this.searchResultItems.push(resultObject);
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
            let height = this.availableContainerHeight + 'px';

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
        }
    }
};
</script>
