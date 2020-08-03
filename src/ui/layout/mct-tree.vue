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
        <tree-item
            v-for="treeItem in allTreeItems"
            :key="treeItem.id"
            :node="treeItem"
        />
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

export default {
    inject: ['openmct'],
    name: 'MctTree',
    components: {
        search,
        treeItem
    },
    data() {
        return {
            searchValue: '',
            allTreeItems: [],
            filteredTreeItems: [],
            isLoading: false
        }
    },
    mounted() {
        this.searchService = this.openmct.$injector.get('searchService');
        this.getAllChildren();
    },
    methods: {
        getAllChildren() {
            this.isLoading = true;
            this.openmct.objects.get('ROOT')
                .then(root => {
                    return this.openmct.composition.get(root).load()
                })
                .then(children => {
                    this.isLoading = false;
                    this.allTreeItems = children.map(c => {
                        return {
                            id: this.openmct.objects.makeKeyString(c.identifier),
                            object: c,
                            objectPath: [c],
                            navigateToParent: '/browse'
                        };
                    });
                });
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
        }
    }
}
</script>
