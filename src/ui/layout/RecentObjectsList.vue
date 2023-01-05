<template>
<div
    class="c-tree-and-search l-shell__tree"
>
    <div
        class="c-tree-and-search__tree c-tree c-tree__scrollable"
    >
        <recent-objects-list-item
            v-for="(recentObject) in recents"
            :key="recentObject.navigationPath"
            :result="recentObject"
        />
    </div>
</div>
</template>

<script>
const MAX_RECENT_ITEMS = 20;
const LOCAL_STORAGE_KEY__RECENT_OBJECTS = 'mct-recent-objects';
import RecentObjectsListItem from './RecentObjectsListItem.vue';
export default {
    name: 'RecentObjectsList',
    components: {
        RecentObjectsListItem
    },
    inject: ['openmct'],
    props: {

    },
    data() {
        return {
            recents: []
        };
    },
    mounted() {
        this.openmct.router.on('change:path', this.onPathChange);
    },
    destroyed() {
        this.openmct.router.off('change:path', this.onPathChange);
    },
    methods: {
        async onPathChange(navigationPath) {
            console.log('hashy changey', navigationPath);
            const objectPath = await this.openmct.objects.getRelativeObjectPath(navigationPath);
            if (!objectPath.length) {
                return;
            }

            const domainObject = objectPath[0];
            const existingIndex = this.recents.findIndex((recentObject) => {
                return navigationPath === recentObject.navigationPath;
            });
            if (existingIndex !== -1) {
                this.recents.splice(existingIndex, 1);
            }

            this.recents.unshift({
                objectPath,
                navigationPath,
                ...domainObject
            });

            while (this.recents.length > MAX_RECENT_ITEMS) {
                this.recents.pop();
            }
        }
    }
};
</script>

<style>

</style>
