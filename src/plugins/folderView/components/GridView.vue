<template>
<div class="l-grid-view">
    <grid-item
        v-for="(item, index) in items"
        :key="index"
        :item="item"
        :object-path="item.objectPath"
    />
</div>
</template>

<script>

import compositionLoader from './composition-loader';
import GridItem from './GridItem.vue';

export default {
    components: {GridItem},
    mixins: [compositionLoader],
    inject: ['openmct']
};
</script>
