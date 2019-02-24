<template>
    <li class="c-properties__row">
        <div class="c-properties__header">{{ filterObject.name }}</div>
        <ul class="c-properties__section">
            <filter-column
                v-for="column in filterObject.columnsWithFilters"
                :key="column.key"
                :filterColumn="column">
            </filter-column>
        </ul>
    </li>
</template>

<style lang="scss">

</style>

<script>
import FilterColumn from './FilterColumn.vue';

export default {
    components: {
        FilterColumn
    },
    props: ["filterObject"]
}
</script>
