<template>
<div>
    <div class="c-tree__item menus-to-left"
        @click="toggleExpanded">
        <span class="c-disclosure-triangle is-enabled flex-elem"
            :class="{'c-disclosure-triangle--expanded': expanded}"></span>
        <div class="c-tree__item__label">
            <div class="t-object-label l-flex-row flex-elem grows">
                <div class="t-item-icon flex-elem"
                    :class="objectCssClass">
                </div>
                <div class="t-title-label flex-elem grows">{{ filterObject.name }}</div>
            </div>
        </div>
    </div>
    <ul class="c-properties__section" v-if="expanded">
        <filter-value
            v-for="column in filterObject.columnsWithFilters"
            :key="column.key"
            :filterValue="column">
        </filter-value>
    </ul>
</div>
</template>

<style lang="scss">

</style>

<script>
import FilterValue from './FilterValue.vue';

export default {
    inject: ['openmct'],
    components: {
        FilterValue
    },
    props: ["filterObject"],
    data() {
        return {
            expanded: false,
            objectCssClass: undefined
        }
    },
    methods: {
        toggleExpanded() {
            this.expanded = !this.expanded;
        }
    },
    mounted() {
        let type = this.openmct.types.get(this.filterObject.domainObject.type) || {};

        this.objectCssClass = type.definition.cssClass;
    }
}
</script>
