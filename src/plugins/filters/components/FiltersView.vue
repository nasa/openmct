<template>
    <ul class="c-tree c-filter-tree" v-if="Object.keys(children).length">
        <h2>Data Filters</h2>
        <div class="c-filter-indication"
            v-if="filtersApplied">{{ label }}
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
                globalMetadata: {},
                children: {},
                filtersApplied: false, // TODO: Wire this up - Should be true when the user has entered any filter values
                filtersMixed: false, // TODO: Wire this up - should be true when filter values are mixed
                label: (true) ? 'Mixed filters applied' : 'Filters applied' // TODO: Wire this up
            }
        },
        methods: {
            addChildren(child) {
                let keyString = this.openmct.objects.makeKeyString(child.identifier),
                    metadata = this.openmct.telemetry.getMetadata(child),
                    metadataWithFilters = metadata.valueMetadatas.filter((value) => value.filters),
                    childExist = this.persistedFilters[keyString] !== undefined,
                    childObject = {
                        name: child.name,
                        domainObject: child,
                        metadataWithFilters
                    };

                if (childObject.metadataWithFilters.length) {
                    this.$set(this.children, keyString, childObject);
                }

                metadataWithFilters.forEach(metadatum => {
                    if (!this.globalFilters[metadatum.key]) {
                        this.$set(this.globalFilters, metadatum.key, {});
                    }

                    if (!this.globalMetadata[metadatum.key]) {
                        this.$set(this.globalMetadata, metadatum.key, metadatum);
                    }

                    if (!childExist) {
                        if (!this.persistedFilters[keyString]) {
                            this.$set(this.persistedFilters, keyString, {});
                            this.$set(this.persistedFilters[keyString], 'useGlobal', true);
                        }

                        this.$set(this.persistedFilters[keyString], metadatum.key, this.globalFilters[metadatum.key]);
                    }
                });
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
                let filterMatched = false;

                this.children[keyString].metadataWithFilters.forEach(metadatum => {
                    let count = 0;
                    Object.keys(this.children).forEach(childKeyString => {
                        if (childKeyString !== keyString) {
                            filterMatched = this.children[childKeyString].metadataWithFilters.some(childMetadatum => childMetadatum.key === metadatum.key);

                            if (filterMatched) {
                                ++count;
                            }
                        }
                    });

                    if (count === 0) {
                        filtersToRemove.add(metadatum.key);
                    }
                });

                return Array.from(filtersToRemove);
            },
            persistFilters(keyString, updatedFilters, useGlobalValues) {
                this.persistedFilters[keyString] = updatedFilters;

                if (useGlobalValues) {
                    console.log(this.persistedFilters[keyString]);
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
                // TODO: 
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
