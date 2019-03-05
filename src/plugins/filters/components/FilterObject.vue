<template>
    <li>
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
        <ul class="grid-properties" v-if="expanded">
            <filter-field
                    v-for="field in filterObject.valuesWithFilters"
                    :key="field.key"
                    :filterField="field"
                    :persistedFilters="persistedFilters[field.key]"
                    @onUserSelect="collectUserSelects"
                    @onTextEnter="updateTextFilter">
            </filter-field>
        </ul>
    </li>
</template>

<style lang="scss">

</style>

<script>
import FilterField from './FilterField.vue';

export default {
    inject: ['openmct'],
    components: {
        FilterField
    },
    props: {
        filterObject: Object, 
        persistedFilters: {
            type: Object,
            default: () => {
                return {};
            }
        }
    },
    data() {
        return {
            expanded: false,
            objectCssClass: undefined,
            updatedFilters: this.persistedFilters
        }
    },
    methods: {
        toggleExpanded() {
            this.expanded = !this.expanded;
        },
        collectUserSelects(key, comparator, valueName, value) {
            let filterValue = this.updatedFilters[key];

            if (filterValue && filterValue[comparator]) {
                if (value === false) {
                    filterValue[comparator] = filterValue[comparator].filter(v => v !== valueName);
                } else {
                    filterValue[comparator].push(valueName);
                }
            } else {
                if (!this.updatedFilters[key]) {
                    this.updatedFilters[key] = {};
                }
                this.updatedFilters[key][comparator] = [value ? valueName : undefined];
            }

            this.$emit('updateFilters', this.keyString, this.updatedFilters);
        },
        updateTextFilter(key, comparator, value) {
            if (!this.updatedFilters[key]) {
                this.updatedFilters[key] = {};
            }
            this.updatedFilters[key][comparator] = value;
            this.$emit('updateFilters', this.keyString, this.updatedFilters);
        }
    },
    mounted() {
        let type = this.openmct.types.get(this.filterObject.domainObject.type) || {};
        this.keyString = this.openmct.objects.makeKeyString(this.filterObject.domainObject.identifier);
        this.objectCssClass = type.definition.cssClass;
    }
}
</script>
