<template>
    <div class="l-grid-view foo">
        <grid-item v-for="(item, index) in items"
            :key="index"
            :item="item"
            :object-path="item.objectPath">
        </grid-item>
    </div>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    /******************************* GRID VIEW */
    .l-grid-view {
        display: flex;
        flex-flow: column nowrap;
        overflow: auto;

        &__item {
            flex: 0 0 auto;
            + .l-grid-view__item { margin-top: $interiorMargin; }
        }

        body.desktop & {
            flex-flow: row wrap;
            &__item {
                height: $gridItemDesk;
                width: $gridItemDesk;
                margin: 0 $interiorMargin $interiorMargin 0;
            }
        }
    }
</style>

<script>

import compositionLoader from './composition-loader';
import GridItem from './GridItem.vue';

export default {
    components: {GridItem},
    mixins: [compositionLoader],
    inject: ['openmct']
}
</script>
