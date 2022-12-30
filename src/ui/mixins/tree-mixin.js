export const SORT_MY_ITEMS_ALPH_ASC = true;
export const TREE_ITEM_INDENT_PX = 18;
export default {
    data: function () {
        return {
            isLoading: false,
            treeItems: [],
            openTreeItems: [],
            visibleItems: [],
            updatingView: false,
            treeItemLoading: {},
            compositionCollections: {},
            selectedItem: {},
            observers: {},
            itemHeight: 27,
            itemOffset: 0
        };
    },
    watch: {
        syncTreeNavigation() {
            this.searchValue = '';

            // if there is an abort controller, then a search is in progress and will need to be canceled
            if (this.abortSearchController) {
                this.abortSearchController.abort();
                delete this.abortSearchController;
            }

            if (!this.openmct.router.path) {
                return;
            }

            this.$nextTick(this.showCurrentPathInTree);
        }
    },
    methods: {
        abortItemLoad(path) {
            if (this.treeItemLoading[path]) {
                this.treeItemLoading[path].abort();
                this.endItemLoad(path);
            }
        },
        buildNavigationPath(objectPath) {
            return '/browse/' + [...objectPath].reverse()
                .map((object) => this.openmct.objects.makeKeyString(object.identifier))
                .join('/');
        },
        buildTreeItem(domainObject, parentObjectPath, isNew = false) {
            let objectPath = [domainObject].concat(parentObjectPath);
            let navigationPath = this.buildNavigationPath(objectPath);

            return {
                id: this.openmct.objects.makeKeyString(domainObject.identifier),
                object: domainObject,
                leftOffset: ((objectPath.length - 1) * TREE_ITEM_INDENT_PX) + 'px',
                isNew,
                objectPath,
                navigationPath
            };
        },
        calculateHeights() {
            const RECHECK = 100;

            return new Promise((resolve, reject) => {

                let checkHeights = () => {
                    let treeTopMargin = this.getElementStyleValue(this.$refs.mainTree, 'marginTop');
                    let paddingOffset = 0;

                    if (
                        this.$el
                        && this.$refs.search
                        && this.$refs.mainTree
                        && this.$refs.treeContainer
                        && this.$refs.dummyItem
                        && this.$el.offsetHeight !== 0
                        && treeTopMargin > 0
                    ) {

                        this.mainTreeTopMargin = treeTopMargin;
                        this.mainTreeHeight = this.$el.offsetHeight
                            - this.$refs.search.offsetHeight
                            - this.mainTreeTopMargin
                            - (paddingOffset * 2);
                        this.itemHeight = this.getElementStyleValue(this.$refs.dummyItem, 'height');

                        resolve();
                    } else {
                        setTimeout(checkHeights, RECHECK);
                    }
                };

                checkHeights();
            });
        },
        closeTreeItem(item) {
            this.closeTreeItemByPath(item.navigationPath);
        },
        closeTreeItemByPath(path) {
            // if actively loading, abort
            if (this.isItemLoading(path)) {
                this.abortItemLoad(path);
            }

            let pathIndex = this.openTreeItems.indexOf(path);

            if (pathIndex === -1) {
                return;
            }

            this.treeItems = this.treeItems.filter((checkItem) => {
                return checkItem.navigationPath === path
                    || !checkItem.navigationPath.includes(path);
            });
            this.openTreeItems.splice(pathIndex, 1);
            // this.removeCompositionListenerFor(path);
        },
        endItemLoad(path) {
            this.$set(this.treeItemLoading, path, undefined);
            delete this.treeItemLoading[path];
        },
        getElementStyleValue(el, style) {
            if (!el) {
                return;
            }

            let styleString = window.getComputedStyle(el)[style];
            let index = styleString.indexOf('px');

            return Number(styleString.slice(0, index));
        },
        handleTreeResize() {
            this.calculateHeights();
        },
        isItemLoading(path) {
            return this.treeItemLoading[path] instanceof AbortController;
        },
        isTreeItemOpen(item) {
            return this.isTreeItemPathOpen(item.navigationPath);
        },
        isTreeItemPathOpen(path) {
            return this.openTreeItems.includes(path);
        },
        async loadAndBuildTreeItemsFor(domainObject, parentObjectPath, abortSignal) {
            let collection = this.openmct.composition.get(domainObject);
            let composition = await collection.load(abortSignal);

            if (SORT_MY_ITEMS_ALPH_ASC && this.isSortable(parentObjectPath)) {
                const sortedComposition = composition.slice().sort(this.sortNameAscending);
                composition = sortedComposition;
            }

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
                this.addTreeItemObserver(object, parentObjectPath);

                return this.buildTreeItem(object, parentObjectPath);
            });
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
        // returns an AbortController signal to be passed on to requests
        startItemLoad(path) {
            if (this.isItemLoading(path)) {
                this.abortItemLoad(path);
            }

            this.$set(this.treeItemLoading, path, new AbortController());

            return this.treeItemLoading[path].signal;
        },
        treeItemAction(parentItem, type) {
            if (type === 'close') {
                this.closeTreeItem(parentItem);
            } else {
                this.openTreeItem(parentItem);
            }
        }
    }
};
