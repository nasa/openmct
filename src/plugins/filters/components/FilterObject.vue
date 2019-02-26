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
            v-for="column in filterObject.valuesWithFilters"
            :key="column.key"
            :filterValue="column"
            :persistedFilter="filterObject.persistedFilters[column.key]"
            @onUserSelect="collectUserSelects">
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
            objectCssClass: undefined,
            userSelects: {}
        }
    },
    methods: {
        toggleExpanded() {
            this.expanded = !this.expanded;
        },
        collectUserSelects(key, comparator, valueName, value) {
            let filterValue = this.userSelects[key];

            if (filterValue && filterValue.comparator === comparator) {
                if (value === false) {
                    filterValue.values = filterValue.values.filter(v => v !== valueName);
                } else {
                    filterValue.values.push(valueName);
                }
            } else {
                this.userSelects[key] = {
                    comparator,
                    values: [value ? valueName : undefined]
                }
            }

            this.$emit('userSelects', this.keyString, this.userSelects);
        }
    },
    mounted() {
        let type = this.openmct.types.get(this.filterObject.domainObject.type) || {};
        this.keyString = this.openmct.objects.makeKeyString(this.filterObject.domainObject.identifier);
        this.objectCssClass = type.definition.cssClass;
    }
}
</script>
