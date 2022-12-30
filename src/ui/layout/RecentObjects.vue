<template>
<div
    class="c-tree-and-search l-shell__tree"
>
    <div
        class="c-tree-and-search__tree c-tree c-tree__scrollable"
    >

        <tree-item
            v-for="(recentItem, index) in treeItems"
            :key="`${recentItem.navigationPath}-recent-${index}`"
            :node="recentItem"
            :is-selector-tree="false"
            :selected-item="selectedItem"
            :left-offset="recentItem.leftOffset"
            :is-new="recentItem.isNew"
            :item-offset="itemOffset"
            :item-index="index"
            :item-height="itemHeight"
            :open-items="openTreeItems"
            :loading-items="treeItemLoading"
        />
        <!-- @tree-item-mounted="scrollToCheck($event)"
            @tree-item-action="treeItemAction(recentItem, $event)"
            @tree-item-destroyed="removeCompositionListenerFor($event)"
            @tree-item-selection="recentItemSelection(recentItem)" -->
    </div>
</div>
</template>

<script>
import treeItem from './tree-item.vue';
import treeMixin from '../mixins/tree-mixin.js';
const MAX_RECENT_ITEMS = 20;
const LOCAL_STORAGE_KEY__RECENT_OBJECTS = 'mct-recent-objects';
export default {
    name: 'RecentObjects',
    components: {
        treeItem
    },
    mixins: [treeMixin],
    inject: ['openmct'],
    props: {

    },
    data() {
        return {
        };
    },
    async mounted() {
        this.openmct.router.on('change:hash', this.onHashChange);

        this.treeResizeObserver = new ResizeObserver(this.handleTreeResize);
        this.treeResizeObserver.observe(this.$el);
        await this.calculateHeights();
    },
    created() {
        this.handleTreeResize = _.debounce(this.handleTreeResize, 300);
    },
    destroyed() {
        this.openmct.router.off('change:hash', this.onHashChange);
    },
    methods: {
        async onHashChange(hash) {
            const objectPath = await this.openmct.objects.getRelativeObjectPath(hash);
            if (!objectPath.length) {
                return;
            }

            const navigationPath = `/browse/${this.openmct.objects.getRelativePath(objectPath.slice(0, -1))}`;
            const foundIndex = this.treeItems.findIndex((item) => {
                return navigationPath === item.navigationPath;
            });
            if (foundIndex > -1) {
                const removedItem = this.treeItems.splice(foundIndex, 1);
                this.selectedItem = removedItem[0];
            } else {
                this.selectedItem = {
                    id: objectPath[0].identifier,
                    object: objectPath[0],
                    objectPath,
                    navigationPath
                };
            }

            this.treeItems.unshift(this.selectedItem);
            while (this.treeItems.length > MAX_RECENT_ITEMS) {
                this.treeItems.pop();
            }
        },
        async loadAndBuildTreeItemsFor(domainObject, parentObjectPath, abortSignal) {
            let collection = this.openmct.composition.get(domainObject);
            let composition = await collection.load(abortSignal);

            return composition.map((object) => {
                return this.buildTreeItem(object, parentObjectPath);
            });
        }
    }
};
</script>

<style>

</style>
