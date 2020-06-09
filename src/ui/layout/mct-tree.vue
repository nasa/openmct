<template>
<div class="c-tree-and-search">
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
        v-if="!isLoading"
        v-show="!searchValue"
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
        <li :class="childrenSlideClass">
            <ul>
                <tree-item
                    v-for="treeItem in allTreeItems"
                    :key="treeItem.id"
                    :node="treeItem"
                    :left-offset="ancestors.length * 10 + 10 + 'px'"
                    @expanded="handleExpanded"
                />
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
            searchValue: '',
            allTreeItems: [],
            filteredTreeItems: [],
            isLoading: false,
            loaded: false,
            ancestors: [],
            childrenSlideClass: 'slide-left'
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
                alreadyNavigatedCheck = descendantPath.split('/');
            alreadyNavigatedCheck.pop();
            alreadyNavigatedCheck = alreadyNavigatedCheck.join('/');

            if(currentLocationPath && this.currentNavigatedPath !== alreadyNavigatedCheck) {
                descendantPath = descendantPath.split('/');
                descendantPath.pop();
                descendantPath = descendantPath.join('/');
                this.allChildren = [];
                this.ancestors = [];
                this.jumpPath = descendantPath;
                this.jumpToPath(true);
            }
        }
    },
    mounted() {
        let expandedPath = this.getLocalStorageExpanded();
        if(expandedPath) {
            this.jumpPath = expandedPath;
        }
        this.searchService = this.openmct.$injector.get('searchService');
        this.openmct.objects.get('ROOT')
            .then(root => {
                let rootNode = this.buildTreeItem(root);
                this.getAllChildren(rootNode);
            });
    },
    methods: {
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
        finishLoading() {
            this.isLoading = false;
            this.loaded = true;
            if(this.jumpPath) {
                this.jumpToPath();
            }
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
                        this.setLocalStorageExpanded();
                    }
                }
            }
        },
        addChild(child) {
            this.allTreeItems.push(this.buildTreeItem(child));
        },
        removeChild(identifier) {
            let removeId = this.openmct.objects.makeKeyString(identifier);
            this.allChildren = this.children
                .filter(c => c.id !== removeId);
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
            this.ancestors.splice(this.ancestors.indexOf(node) + 1);
            this.getAllChildren(node);
            this.childrenSlideClass = 'slide-right';
            this.setLocalStorageExpanded();
        },
        handleExpanded(node) {
            let newParent = this.buildTreeItem(node);
            this.ancestors.push(newParent);
            this.getAllChildren(newParent);
            this.childrenSlideClass = 'slide-left';
            this.setLocalStorageExpanded();
        },
        getLocalStorageExpanded() {
            return JSON.parse(localStorage.getItem(LOCAL_STORAGE_KEY__TREE_EXPANDED));
        },
        setLocalStorageExpanded() {
            localStorage.setItem(LOCAL_STORAGE_KEY__TREE_EXPANDED, JSON.stringify(this.currentNavigatedPath));
        }
    }
}
</script>
