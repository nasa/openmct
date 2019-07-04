<template>
    <ul class="c-tree c-filter-tree" v-if="Object.keys(children).length">
        <h2>Data Filters</h2>
        <div class="c-filter-indication"
            v-if="filtersApplied">{{ label }}
        </div>
        <global-filters
            :globalFilters="globalFilters"
            :globalObject="globalObject"
            @persistGlobalFilters="persistGlobalFilters">
        </global-filters>
        <filter-object 
            v-for="(child, key) in children"
            :key="key"
            :filterObject="child"
            :persistedFilters="persistedFilters[key]"
            @updateFilters="persistFilters">
        </filter-object>
    </ul>
</template>

<style lang="scss">
    @import "~styles/sass-base";

    .c-inspector {
        .c-filter-indication {
            border-radius: $smallCr;
            font-size: inherit;
            padding: $interiorMarginSm $interiorMargin;
            text-transform: inherit;
        }
        .c-filter-tree {
            // Filters UI uses a tree-based structure
            .c-properties {
                // Add extra margin to account for filter-indicator
                margin-left: 38px;
            }
        }
    }

</style>

<script>
import FilterObject from './FilterObject.vue';
import GlobalFilters from './GlobalFilters.vue'

export default {
    components: {
        FilterObject,
        GlobalFilters
    },
    inject: [
        'openmct'
    ],
    data() {
        let providedObject = this.openmct.selection.get()[0][0].context.item;
        let configuration = providedObject.configuration;
        let persistedFilters = {};
        let globalFilters = {};

        if (configuration && configuration.filters) {
            persistedFilters = configuration.filters;
        }

        if (configuration && configuration.globalFilters) {
            globalFilters = configuration.globalFilters;
        }

        return {
            providedObject,
            persistedFilters,
            globalFilters,
            globalObject: {},
            children: {},
            filtersApplied: false, //TODO: Wire this up - should be true when the user has entered any filter values
            filtersMixed: false, // TODO: Wire this up - should be true when filter values are mixed
            label: (true) ? 'Mixed filters applied' : 'Filters applied' // TODO: Wire this up
        }
    },
    methods: {
        addChildren(child) {
            let keyString = this.openmct.objects.makeKeyString(child.identifier),
                metadata = this.openmct.telemetry.getMetadata(child),
                valuesWithFilters = metadata.valueMetadatas.filter((value) => value.filters),
                childExist = this.persistedFilters[keyString] !== undefined,
                childObject = {
                    name: child.name,
                    domainObject: child,
                    valuesWithFilters
                };

            if (childObject.valuesWithFilters.length) {
                this.$set(this.children, keyString, childObject);
            }

            valuesWithFilters.forEach(field => {
                if (!this.globalFilters[field.key]) {
                    this.$set(this.globalFilters, field.key, {});
                }

                if (!this.globalObject[field.key]) {
                    this.$set(this.globalObject, field.key, field);
                }

                if (!childExist) {
                    if (!this.persistedFilters[keyString]) {
                        this.$set(this.persistedFilters, keyString, {});
                        this.$set(this.persistedFilters[keyString], 'useGlobal', true);
                    }

                    this.$set(this.persistedFilters[keyString], field.key, this.globalFilters[field.key]);
                }
            });
        },
        removeChildren(identifier) {
            let keyString = this.openmct.objects.makeKeyString(identifier);
            let globalFiltersToRemove = this.getGlobalFiltersToRemove(keyString);

            if (globalFiltersToRemove.length > 0) {
                globalFiltersToRemove.forEach(filter => {
                    this.$delete(this.globalFilters, filter);
                    this.$delete(this.globalObject, filter);
                });
                this.mutateConfigurationGlobalFilters();
            }

            this.$delete(this.children, keyString);
            this.$delete(this.persistedFilters, keyString);
            this.mutateConfigurationFilters();
        },
        getGlobalFiltersToRemove(keyString) {
            let filtersToRemove = new Set();
            let valuesWithFilters = this.children[keyString].valuesWithFilters;
            let filterMatched = false;

            valuesWithFilters.forEach(metadata => {
                let count = 0;
                Object.keys(this.children).forEach(childKeyString => {
                    if (childKeyString !== keyString) {
                        filterMatched = this.children[childKeyString].valuesWithFilters.some(childMetadata => childMetadata.key === metadata.key);

                        if (filterMatched) {
                            ++count;
                        }
                    }
                });

                if (count === 0) {
                    filtersToRemove.add(metadata.key);
                }
            });

            return Array.from(filtersToRemove);
        },
        persistFilters(keyString, userSelects) {
            this.persistedFilters[keyString] = userSelects;
            this.mutateConfigurationFilters();
        },
        updatePersistedFilters(filters) {
            this.persistedFilters = filters;
        },
        persistGlobalFilters(key, userSelects) {
            this.globalFilters[key] = userSelects[key];
            this.mutateConfigurationGlobalFilters();

            Object.keys(this.children).forEach(keyString => {
                if (this.persistedFilters[keyString].useGlobal !== false && this.containsField(keyString, key)) {
                    if (!this.persistedFilters[keyString][key]) {
                        this.$set(this.persistedFilters[keyString], key, {});
                    }

                    this.$set(this.persistedFilters[keyString], key, userSelects[key]);
                }
            });
            this.mutateConfigurationFilters();
        },
        updateGlobalFilters(filters) {
            this.globalFilters = filters;
        },
        containsField(keyString, field) {
            let hasField = false;
            this.children[keyString].valuesWithFilters.forEach(value => {
                if (value.key === field) {
                    hasField = true;
                    return;
                }
            });
            return hasField;
        },
        mutateConfigurationFilters() {
            this.openmct.objects.mutate(this.providedObject, 'configuration.filters', this.persistedFilters);
        },
        mutateConfigurationGlobalFilters() {
            this.openmct.objects.mutate(this.providedObject, 'configuration.globalFilters', this.globalFilters);
        }
    },
    mounted(){
        this.composition = this.openmct.composition.get(this.providedObject);
        this.composition.on('add', this.addChildren);
        this.composition.on('remove', this.removeChildren);
        this.composition.load();
        this.unobserve = this.openmct.objects.observe(this.providedObject, 'configuration.filters', this.updatePersistedFilters);
        this.unobserveGlobalFilters = this.openmct.objects.observe(this.providedObject, 'configuration.globalFilters', this.updateGlobalFilters);
        this.unobserveAllMutation = this.openmct.objects.observe(this.providedObject, '*', (mutatedObject) => this.providedObject = mutatedObject);
    },
    beforeDestroy() {
        this.composition.off('add', this.addChildren);
        this.composition.off('remove', this.removeChildren);
        this.unobserve();
        this.unobserveGlobalFilters();
        this.unobserveAllMutation();
    }
}
</script>
