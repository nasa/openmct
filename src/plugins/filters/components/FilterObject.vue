<template>
    <li class="c-tree__item-h">
        <div class="c-tree__item menus-to-left"
             @click="toggleExpanded">
            <div class="c-filter-tree-item__filter-indicator"
                :class="{'icon-filter': filtersDefined }"></div>
            <span class="c-disclosure-triangle is-enabled flex-elem"
              :class="{'c-disclosure-triangle--expanded': expanded}"></span>
            <div class="c-tree__item__label c-object-label">
                <div class="c-object-label">
                    <div class="c-object-label__type-icon"
                         :class="objectCssClass">
                    </div>
                    <div class="c-object-label__name flex-elem grows">{{ filterObject.name }}</div>
                </div>
            </div>
        </div>

        <div v-if="expanded">
            <ul class="c-properties">
                <div class="c-properties__label span-all"
                     v-if="!isEditing && persistedFilters.useGlobal">
                    Uses global filter
                </div>

                <div class="c-properties__label span-all"
                     v-if="isEditing">
                    <toggle-switch
                            :id="keyString"
                            @change="onUseGlobalFilter"
                            :checked="persistedFilters.useGlobal">
                    </toggle-switch>
                    Use global filter
                </div>
                <filter-field
                        v-if="(!persistedFilters.useGlobal && !isEditing) || isEditing"
                        v-for="field in filterObject.valuesWithFilters"
                        :key="field.key"
                        :filterField="field"
                        :useGlobal="persistedFilters.useGlobal"
                        :persistedFilters="persistedFilters[field.key]"
                        @onUserSelect="collectUserSelects"
                        @onTextEnter="updateTextFilter">
                </filter-field>
            </ul>
        </div>
    </li>
</template>

<script>
import FilterField from './FilterField.vue';
import ToggleSwitch from '../../../ui/components/ToggleSwitch.vue';

export default {
    inject: ['openmct'],
    components: {
        FilterField,
        ToggleSwitch
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
            updatedFilters: this.persistedFilters,
            filtersDefined: true, // TODO: Wire this up - should be true when the user has entered filter values, or this item is using global filters and filters have been defined
            isEditing: this.openmct.editor.isEditing()
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
                    let filteredValueName = filterValue[comparator].filter(v => v !== valueName);

                    if (filteredValueName.length === 0) {
                        delete this.updatedFilters[key];
                    } else {
                        filterValue[comparator] = filteredValueName;
                    }
                } else {
                    filterValue[comparator].push(valueName);
                }
            } else {
                if (!this.updatedFilters[key]) {
                    this.$set(this.updatedFilters, key, {});
                }
                this.$set(this.updatedFilters[key], comparator, [value ? valueName : undefined]);
            }

            this.$emit('updateFilters', this.keyString, this.updatedFilters);
        },
        updateTextFilter(key, comparator, value) {
            if (value.trim() === '') {
                if (this.updatedFilters[key]) {
                    delete this.updatedFilters[key];
                    this.$emit('updateFilters', this.keyString, this.updatedFilters);
                }
                return;
            }

            if (!this.updatedFilters[key]) {
                this.$set(this.updatedFilters, key, {});
                this.$set(this.updatedFilters[key], comparator, '');
            }

            this.$set(this.updatedFilters[key], comparator, value);
            this.$emit('updateFilters', this.keyString, this.updatedFilters);
        },
        onUseGlobalFilter(checked) {
            this.updatedFilters.useGlobal = checked;
            this.$emit('updateFilters', this.keyString, this.updatedFilters);
        },
        toggleIsEditing(isEditing) {
            this.isEditing = isEditing;
        },
    },
    mounted() {
        let type = this.openmct.types.get(this.filterObject.domainObject.type) || {};
        this.keyString = this.openmct.objects.makeKeyString(this.filterObject.domainObject.identifier);
        this.objectCssClass = type.definition.cssClass;
        this.openmct.editor.on('isEditing', this.toggleIsEditing);
    },
    beforeDestroy() {
        this.openmct.editor.off('isEditing', this.toggleIsEditing);
    }
}
</script>
