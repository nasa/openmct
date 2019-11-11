<template>
    <ul class="c-tree c-filter-tree" v-if="Object.keys(children).length">
        <h2>Data Filters</h2>
        <div class="c-filter-indication"
            v-if="hasActiveFilters">{{ label }}
        </div>
        <global-filters
            :globalFilters="globalFilters"
            :globalMetadata="globalMetadata"
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

    const FILTER_VIEW_TITLE = 'Filters applied';
    const FILTER_VIEW_TITLE_MIXED = 'Mixed filters applied';
    const USE_GLOBAL = 'useGlobal';

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

            return {
                persistedFilters: (configuration && configuration.filters) || {},
                globalFilters: (configuration && configuration.globalFilters) || {},
                globalMetadata: {},
                providedObject,
                children: {}
            }
        },
        computed: {
            hasActiveFilters() {
                // Should be true when the user has entered any filter values.
                return Object.values(this.persistedFilters).some(filters => {
                    return Object.values(filters).some(comparator => {
                        return (typeof(comparator) === 'object' && !_.isEmpty(comparator));
                    });
                });
            },
            hasMixedFilters() {
                // Should be true when filter values are mixed.
                let filtersToCompare = _.omit(this.persistedFilters[Object.keys(this.persistedFilters)[0]], [USE_GLOBAL]);
                return Object.values(this.persistedFilters).some(filters => {
                    return !_.isEqual(filtersToCompare, _.omit(filters, [USE_GLOBAL]));
                });
            },
            label() {
                if (this.hasActiveFilters) {
                    if (this.hasMixedFilters) {
                        return FILTER_VIEW_TITLE_MIXED;
                    } else {
                        return FILTER_VIEW_TITLE;
                    }
                }
            }
        },
        methods: {
            addChildren(domainObject) {
                let keyString = this.openmct.objects.makeKeyString(domainObject.identifier);
                let metadata = this.openmct.telemetry.getMetadata(domainObject);
                let metadataWithFilters = metadata.valueMetadatas.filter(value => value.filters);
                let hasFiltersWithKeyString = this.persistedFilters[keyString] !== undefined;
                let mutateFilters = false;
                let childObject = {
                    name: domainObject.name,
                    domainObject: domainObject,
                    metadataWithFilters
                };

                if (metadataWithFilters.length) {
                    this.$set(this.children, keyString, childObject);

                    metadataWithFilters.forEach(metadatum => {
                        if (!this.globalFilters[metadatum.key]) {
                            this.$set(this.globalFilters, metadatum.key, {});
                        }

                        if (!this.globalMetadata[metadatum.key]) {
                            this.$set(this.globalMetadata, metadatum.key, metadatum);
                        }

                        if (!hasFiltersWithKeyString) {
                            if (!this.persistedFilters[keyString]) {
                                this.$set(this.persistedFilters, keyString, {});
                                this.$set(this.persistedFilters[keyString], 'useGlobal', true);
                                mutateFilters = true;
                            }

                            this.$set(this.persistedFilters[keyString], metadatum.key, this.globalFilters[metadatum.key]);
                        }
                    });
                }

                if (mutateFilters) {
                    this.mutateConfigurationFilters();
                }
            },
            removeChildren(identifier) {
                let keyString = this.openmct.objects.makeKeyString(identifier);
                let globalFiltersToRemove = this.getGlobalFiltersToRemove(keyString);

                if (globalFiltersToRemove.length > 0) {
                    globalFiltersToRemove.forEach(key => {
                        this.$delete(this.globalFilters, key);
                        this.$delete(this.globalMetadata, key);
                    });
                    this.mutateConfigurationGlobalFilters();
                }

                this.$delete(this.children, keyString);
                this.$delete(this.persistedFilters, keyString);
                this.mutateConfigurationFilters();
            },
            getGlobalFiltersToRemove(keyString) {
                let filtersToRemove = new Set();
                if (this.children[keyString]){
                    this.children[keyString].metadataWithFilters.forEach(metadatum => {
                        let keepFilter = false
                        Object.keys(this.children).forEach(childKeyString => {
                            if (childKeyString !== keyString) {
                                let filterMatched = this.children[childKeyString].metadataWithFilters.some(childMetadatum => childMetadatum.key === metadatum.key);

                                if (filterMatched) {
                                    keepFilter = true;
                                    return;
                                }
                            }
                        });

                        if (!keepFilter) {
                            filtersToRemove.add(metadatum.key);
                        }
                    });
                }

                return Array.from(filtersToRemove);
            },
            persistFilters(keyString, updatedFilters, useGlobalValues) {
                this.persistedFilters[keyString] = updatedFilters;

                if (useGlobalValues) {
                    Object.keys(this.persistedFilters[keyString]).forEach(key => {
                        if (typeof(this.persistedFilters[keyString][key]) === 'object') {
                            this.persistedFilters[keyString][key]  = this.globalFilters[key];
                        }
                    });
                }
            
                this.mutateConfigurationFilters();
            },
            updatePersistedFilters(filters) {
                this.persistedFilters = filters;
            },
            persistGlobalFilters(key, filters) {
                this.globalFilters[key] = filters[key];
                this.mutateConfigurationGlobalFilters();
                let mutateFilters = false;

                Object.keys(this.children).forEach(keyString => {
                    if (this.persistedFilters[keyString].useGlobal !== false && this.containsField(keyString, key)) {
                        if (!this.persistedFilters[keyString][key]) {
                            this.$set(this.persistedFilters[keyString], key, {});
                        }

                        this.$set(this.persistedFilters[keyString], key, filters[key]);
                        mutateFilters = true;
                    }
                });

                if (mutateFilters) {
                    this.mutateConfigurationFilters();
                }
            },
            updateGlobalFilters(filters) {
                this.globalFilters = filters;
            },
            containsField(keyString, field) {
                let hasField = false;
                this.children[keyString].metadataWithFilters.forEach(metadatum => {
                    if (metadatum.key === field) {
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
        },
        beforeDestroy() {
            this.composition.off('add', this.addChildren);
            this.composition.off('remove', this.removeChildren);
            this.unobserve();
            this.unobserveGlobalFilters();
        }
    }
</script>
