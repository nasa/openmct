<template>
<div class="c-tree-scrollable">
    <tree-item
        v-for="(recentItem, index) in recentItems"
        :key="`${recentItem.navigationPath}-recent-${index}`"
        :node="recentItem"
        :is-selector-tree="false"
        :selected-item="selectedItem"
        :active-search="activeSearch"
        :left-offset="!activeSearch ? recentItem.leftOffset : '0px'"
        :is-new="recentItem.isNew"
        :item-offset="itemOffset"
        :item-index="index"
        :item-height="itemHeight"
        :open-items="[]"
        :loading-items="false"
    />
    <!-- @tree-item-mounted="scrollToCheck($event)"
        @tree-item-destroyed="removeCompositionListenerFor($event)"
        @tree-item-action="recentItemAction(recentItem, $event)"
        @tree-item-selection="recentItemSelection(recentItem)" -->
</div>
</template>

<script>
import treeItem from './tree-item.vue';
const LOCAL_STORAGE_KEY__RECENT_OBJECTS = 'mct-recent-objects';
export default {
    name: 'RecentObjects',
    components: {
        treeItem
    },
    inject: ['openmct'],
    props: {

    },
    data() {
        return {
            recentItems: [],
            selectedItem: null,
            itemHeight: 27,
            itemOffset: 0
        };
    },
    async mounted() {
        if (typeof this.unlisten === 'function') {
            this.unlisten();
        }

        this.unlisten = this.openmct.router.on('change:hash', this.onHashChange);

        this.treeResizeObserver = new ResizeObserver(this.handleTreeResize);
        this.treeResizeObserver.observe(this.$el);
        await this.calculateHeights();
    },
    created() {
        this.handleTreeResize = _.debounce(this.handleTreeResize, 300);
    },
    destroyed() {
        if (typeof this.unlisten === 'function') {
            this.unlisten();
        }
    },
    methods: {
        async onHashChange(hash) {
            const objectPath = await this.openmct.objects.getRelativeObjectPath(hash);
            this.recentItems.unshift({
                id: objectPath[0].id,
                object: objectPath[0],
                objectPath,
                navigationPath: `/browse/${this.openmct.objects.getRelativePath(objectPath.slice(0, -1))}`
            });
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
        }
    }
};
</script>

<style>

</style>
