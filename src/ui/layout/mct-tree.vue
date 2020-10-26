<template>
<div
    ref="searchAndTree"
    class="c-tree-and-search"
>

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
                style="left: -1000px; position: absolute;"
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

            <tree-item
                v-for="(ancestor, index) in ancestors"
                :key="ancestor.id"
                :node="ancestor"
                :show-up="index < ancestors.length - 1"
                :show-down="false"
                :left-offset="index * 10 + 'px'"
                @resetTree="beginNavigationRequest('handleReset', ancestor)"
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
        </div>

        <!-- currently viewed children -->
        <transition
            name="children"
            appear
            @after-enter="autoScroll"
        >
            <div
                v-if="showChildContainer"
                :style="childrenListStyles()"
                :class="childrenSlideClass"
            >
                <div
                    ref="scrollable"
                    class="c-tree__scrollable-children"
                    :style="scrollableStyles()"
                    @scroll="scrollItems"
                >
                    <div :style="{ height: childrenHeight + 'px' }">
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
                            @expanded="beginNavigationRequest('handleExpanded', treeItem)"
                        />
                        <div
                            v-if="showNoItems"
                            :style="indicatorLeftOffset"
                            class="c-tree__item c-tree__item--empty"
                        >
                            No items
                        </div>
                    </div>
                </div>
            </div>
        </transition>
    </div>
    <!-- end main tree -->

</div>
</template>

<script>
import _ from 'lodash';
import treeItem from './tree-item.vue';
import search from '../components/search.vue';
import objectUtils from 'objectUtils';
import uuid from 'uuid';

const LOCAL_STORAGE_KEY__TREE_EXPANDED__OLD = 'mct-tree-expanded';
const LOCAL_STORAGE_KEY__EXPANDED_TREE_NODE = 'mct-expanded-tree-node';
const ROOT_PATH = 'browse';
const ITEM_BUFFER = 5;

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
            root: undefined,
            isLoading: false,
            mainTreeHeight: undefined,
            searchLoading: false,
            searchValue: '',
            childItems: [],
            searchResultItems: [],
            visibleItems: [],
            ancestors: [],
            childrenSlideClass: 'down',
            updatingView: false,
            itemHeight: 27,
            itemOffset: 0,
            activeSearch: false,
            multipleRootChildren: false,
            observedAncestors: {},
            mainTreeTopMargin: undefined
        };
    },
    computed: {
        currentTreePath() {
            let path = [...this.ancestors]
                .map((ancestor) => ancestor.id)
                .join('/');

            // if not multiRootChildren, then need to add in root ('browse')
            if (!this.multipleRootChildren) {
                path = ROOT_PATH + '/' + path;
            // if multiRootChldren, need to replace root id with 'browse'
            } else {
                path = path.replace('ROOT', ROOT_PATH);
            }

            return path;
        },
        focusedItems() {
            return this.activeSearch ? this.searchResultItems : this.childItems;
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
        },
        childrenHeight() {
            let childrenCount = this.focusedItems.length || 1;

            return (this.itemHeight * childrenCount) - this.mainTreeTopMargin; // 5px margin
        },
        availableContainerHeight() {
            return this.mainTreeHeight - this.ancestorsHeight;
        },
        showNoItems() {
            return this.visibleItems.length === 0 && !this.activeSearch;
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
            this.searchValue = '';

            if (!this.openmct.router.path) {
                return;
            }

            if (this.currentPathIsActivePath() && !this.isLoading) {
                this.skipScroll = false;
                this.autoScroll();

                return;
            }

            console.log('sync tree further');

            let routePath = [...this.openmct.router.path];
            routePath.shift(); // remove the child, so it navigates to the parent
            routePath.push(this.root); // adding root
            this.beginNavigationRequest('jumpTo', [...routePath].reverse());
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
        let savedPath = this.getStoredTreePath();

        this.initialize();
        let rootComposition = await this.loadRoot();

        if (!savedPath) {
            savedPath = ROOT_PATH;
            if (!this.multipleRootChildren) {
                let id = this.openmct.objects.makeKeyString(rootComposition[0].identifier);
                savedPath += '/' + id;
            }
        }

        this.beginNavigationRequest('jumpTo', savedPath);
    },
    created() {
        this.getSearchResults = _.debounce(this.getSearchResults, 400);
        this.handleWindowResize = _.debounce(this.handleWindowResize, 500);
    },
    destroyed() {
        window.removeEventListener('resize', this.handleWindowResize);
        this.stopObservingAncestors();
        document.removeEventListener('readystatechange', this.setTreeTopMargin);
    },
    methods: {
        initialize() {
            this.searchService = this.openmct.$injector.get('searchService');
            window.addEventListener('resize', this.handleWindowResize);
            this.readyStateCheck();
            this.backwardsCompatibilityCheck();
        },
        readyStateCheck() {
            if (document.readyState !== 'complete') {
                document.addEventListener('readystatechange', this.onReadyState);
            } else {
                this.onReadyState();
            }
        },
        onReadyState() {
            if (document.readyState === 'complete') {
                this.calculateHeights();
            }
        },
        backwardsCompatibilityCheck() {
            let oldTreeExpanded = JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY__TREE_EXPANDED__OLD));

            if (oldTreeExpanded) {
                localStorage.removeItem(LOCAL_STORAGE_KEY__TREE_EXPANDED__OLD);
            }
        },
        async loadRoot() {
            this.root = await this.openmct.objects.get('ROOT');

            let rootCompositionCollection = this.openmct.composition.get(this.root);
            let rootComposition = await rootCompositionCollection.load();

            if (rootComposition.length > 1) {
                this.multipleRootChildren = true;
            }

            return rootComposition;
        },
        async beginNavigationRequest(type, request) {
            let requestId = uuid();

            this.isLoading = true;
            this.latestNavigationRequest = requestId;

            if (['handleReset', 'handleExpanded'].indexOf(type) !== -1) {
                this.skipScroll = true;
            } else {
                this.skipScroll = false;
            }

            let success = await this[type](request, requestId);

            if (success && this.isLatestNavigationRequest(requestId)) {
                this.isLoading = false;
                this.storeCurrentTreePath();
            }
        },
        isLatestNavigationRequest(requestId) {
            return this.latestNavigationRequest === requestId;
        },
        // will jump to an object path or a string path
        async jumpTo(path, requestId) {
            if (!this.isLatestNavigationRequest(requestId)) {
                return false;
            }

            // if path string, build object string
            if (typeof path === 'string') {
                path = await this.buildObjectPathFromString(path, requestId);

                if (!path) {
                    return false;
                }
            }

            // build ancestors tree items from objects
            let ancestorItems = [];
            for (let i = 0; i < path.length; i++) {
                let builtAncestor = this.buildTreeItem(path[i], path.slice(0, i));
                ancestorItems.push(builtAncestor);
            }

            // load children for last ancestor
            let childrenItems = await this.getChildrenAsTreeItems(ancestorItems[ancestorItems.length - 1], path, requestId);

            // if all is good, return true for successful navigation
            return this.updateTree(ancestorItems, childrenItems, requestId);
        },
        async handleReset(node, requestId) {
            if (!this.isLatestNavigationRequest(requestId)) {
                return false;
            }

            this.childrenSlideClass = 'up';

            let ancestorItems = [...this.ancestors];
            ancestorItems.splice(ancestorItems.indexOf(node) + 1);

            let objectPath = this.ancestorsAsObjects();
            objectPath.splice(objectPath.indexOf(node.object) + 1);

            let childrenItems = await this.getChildrenAsTreeItems(node, objectPath, requestId);

            // if all is good, return true for successful navigation
            return this.updateTree(ancestorItems, childrenItems, requestId);
        },
        async handleExpanded(node, requestId) {
            if (!this.isLatestNavigationRequest(requestId)) {
                return false;
            }

            this.childrenSlideClass = 'down';

            let ancestorItems = [...this.ancestors];
            ancestorItems.push(node);

            let objectPath = this.ancestorsAsObjects().concat(node.object);

            let childrenItems = await this.getChildrenAsTreeItems(node, objectPath, requestId);

            // if all is good, return true for successful navigation
            return this.updateTree(ancestorItems, childrenItems, requestId);

        },
        ancestorsAsObjects() {
            let ancestorsCopy = [...this.ancestors];

            if (this.multipleRootChildren && ancestorsCopy[0].id === 'ROOT') {
                // no root for object paths
                ancestorsCopy.shift();
            }

            return ancestorsCopy.map(item => item.object);
        },
        async buildObjectPathFromString(path, requestId) {
            let pathNodes = path.split('/');
            let objectPath = [this.root];

            // skip first element, it's root "browse" path, handled above
            for (let i = 1; i < pathNodes.length; i++) {
                let domainObject = await this.openmct.objects.get(pathNodes[i]);
                objectPath.push(domainObject);

                if (!this.isLatestNavigationRequest(requestId)) {
                    return false;
                }
            }

            return objectPath;
        },
        delayIt(duration) {
            return new Promise((resolve, reject) => {
                setTimeout(resolve, duration);
            });
        },
        async getChildrenAsTreeItems(item, parentObjectPath, requestId) {
            if (!this.isLatestNavigationRequest(requestId)) {
                return false;
            }

            if (this.composition) {
                this.composition.off('add', this.addChild);
                this.composition.off('remove', this.removeChild);
                delete this.composition;
            }

            this.childItems = [];
            let tempComposition = this.openmct.composition.get(item.object);
            let children = await tempComposition.load();
            await this.delayIt(1000);

            if (!this.isLatestNavigationRequest(requestId)) {
                return false;
            }

            this.composition = tempComposition;

            return children.map((child) => {
                return this.buildTreeItem(child, parentObjectPath);
            });
        },
        async updateTree(ancestors, children, requestId) {
            if (!this.isLatestNavigationRequest(requestId)) {
                return false;
            }

            // show or don't show root
            if (!this.multipleRootChildren && ancestors[0].id === 'ROOT') {
                ancestors.shift();
            }

            await this.clearVisibleItems();

            this.ancestors = ancestors;
            this.childItems = children;

            // any new items added or removed handled here
            this.composition.on('add', this.addChild);
            this.composition.on('remove', this.removeChild);

            return true;
        },
        // domainObject: from composition add event
        addChild(domainObject) {
            let item = this.buildTreeItem(domainObject, this.ancestorsAsObjects());
            this.childItems.push(item);
        },
        removeChild(identifier) {
            let removeId = this.openmct.objects.makeKeyString(identifier);
            this.childItems = this.childItems
                .filter(c => c.id !== removeId);
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
        scrollItems(event) {
            this.updateVisibleItems();
        },
        handleWindowResize() {
            this.calculateHeights();
        },
        // domainObject: we're building a tree item for this
        // objects: domainObject array up to parent of domainObject, excluding domainObject for item being built
        buildTreeItem(domainObject, objects) {
            let objectPath = [...objects];

            // remove root for object path
            if (objectPath[0] && objectPath[0].type === 'root') {
                objectPath.shift();
            }

            let navigationPath = this.buildNavigationPath(domainObject, objectPath);
            let builtObjectPath = [...objectPath].reverse();

            return {
                id: this.openmct.objects.makeKeyString(domainObject.identifier),
                object: domainObject,
                objectPath: [domainObject].concat(builtObjectPath),
                navigationPath
            };
        },
        // domainObject: the item we're building the path for (will be used in url and links)
        // objects: array of domainObjects representing path to domainobject passed in
        buildNavigationPath(domainObject, objects) {
            let path = [...objects]
                .map(object => this.openmct.objects.makeKeyString(object.identifier));

            return '/' + [
                ROOT_PATH,
                ...path,
                this.openmct.objects.makeKeyString(domainObject.identifier)
            ].join('/');
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
                    let ancestorObjects = this.ancestorsAsObjects();
                    // ancestor has been removed from tree, reset to it's parent
                    if (location === null) {
                        let index = ancestorObjects.indexOf(object);
                        let offset = this.multipleRootChildren ? 0 : 1; // account for ancestorsAsObjects removing root
                        let parentIndex = index - offset;
                        if (this.ancestors[parentIndex]) {
                            this.beginNavigationRequest('handleReset', this.ancestors[parentIndex]);
                        }
                    }
                });
        },
        autoScroll() {
            if (this.currentPathIsActivePath() && !this.skipScroll && this.$refs.scrollable) {
                let indexOfScroll = this.indexOfItemById(this.currentlyViewedObjectId());
                let scrollTopAmount = indexOfScroll * this.itemHeight;
                this.$refs.scrollable.scrollTo({
                    top: scrollTopAmount,
                    behavior: 'smooth'
                });
            }
        },
        indexOfItemById(id) {
            for (let i = 0; i < this.childItems.length; i++) {
                if (this.childItems[i].id === id) {
                    return i;
                }
            }
        },
        async getSearchResults() {
            let results = await this.searchService.query(this.searchValue);
            this.searchResultItems = [];

            for (let i = 0; i < results.hits.length; i++) {
                let result = results.hits[i];
                let newStyleObject = objectUtils.toNewFormat(result.object.getModel(), result.object.getId());
                let objectPath = await this.openmct.objects.getOriginalPath(newStyleObject.identifier);

                // removing the item itself, as the path we pass to buildTreeItem is a parent path
                objectPath.shift();

                // if root, remove, we're not using in object path for tree
                let lastObject = objectPath.length ? objectPath[objectPath.length - 1] : false;
                if (lastObject && lastObject.type === 'root') {
                    objectPath.pop();
                }

                // we reverse the objectPath in the tree, so have to do it here first,
                // since this one is already in the correct direction
                let resultObject = this.buildTreeItem(newStyleObject, objectPath.reverse());

                this.searchResultItems.push(resultObject);
            }

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
        getStoredTreePath() {
            return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY__EXPANDED_TREE_NODE));
        },
        storeCurrentTreePath() {
            if (!this.searchValue) {
                localStorage.setItem(LOCAL_STORAGE_KEY__EXPANDED_TREE_NODE, JSON.stringify(this.currentTreePath));
            }
        },
        currentPathIsActivePath() {
            return this.getStoredTreePath() === this.currentlyViewedObjectParentPath();
        },
        currentlyViewedObjectId() {
            let currentPath = this.openmct.router.currentLocation.path;
            if (currentPath) {
                return currentPath.split('/').pop();
            }
        },
        currentlyViewedObjectParentPath() {
            let currentPath = this.openmct.router.currentLocation.path;

            if (currentPath) {
                currentPath = currentPath.split('/');
                currentPath.shift(); // remove empty array element from initial '/'
                currentPath.pop(); // remove current child

                return currentPath.join('/');
            }
        },
        async clearVisibleItems() {
            this.visibleItems = [];
            await this.$nextTick(); // prevents "ghost" image of visibleItems

            return;
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
        calculateHeights() {
            this.mainTreeTopMargin = this.getElementStyleValue(this.$refs.mainTree, 'marginTop');
            this.mainTreeHeight = this.$refs.searchAndTree.offsetHeight
                - this.$refs.search.offsetHeight
                - this.mainTreeTopMargin;
            this.itemHeight = this.getElementStyleValue(this.$refs.dummyItem, 'height');
        }
    }
};
</script>
