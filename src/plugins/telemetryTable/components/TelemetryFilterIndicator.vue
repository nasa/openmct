<template>
    <div v-if="filterNames.length > 0"
        :title=title
        class="c-filter-indication"
        :class="{ 'c-filter-indication--mixed': filtersMixed }">
        <span class="c-filter-indication__mixed">{{ label }}</span>
        <span v-for="(name, index) in filterNames"
              class="c-filter-indication__label">
            {{ name }}
        </span>
    </div>
</template>

<style lang="scss">
    @import "~styles/sass-base";
    .c-filter-indication {
        @include userSelectNone();
        background: $colorFilterBg;
        color: $colorFilterFg;
        display: flex;
        align-items: center;
        font-size: 0.9em;
        margin-top: $interiorMarginSm;
        padding: 2px;
        text-transform: uppercase;

        &:before {
            font-family: symbolsfont-12px;
            content: $glyph-icon-filter;
            display: block;
            font-size: 12px;
            margin-right: $interiorMarginSm;
        }

        &__mixed {
            margin-right: $interiorMarginSm;
        }

        &--mixed {
            .c-filter-indication__mixed {
                font-style: italic;
            }
        }

        &__label {
            + .c-filter-indication__label {
                &:before {
                    content: ',';
                }
            }
        }
    }
</style>

<script>
    const FILTER_INDICATOR_LABEL = 'Filters:';
    const FILTER_INDICATOR_LABEL_MIXED = 'Mixed Filters:';
    const FILTER_INDICATOR_TITLE = 'Data filters are being applied to this view.';
    const FILTER_INDICATOR_TITLE_MIXED = 'A mix of data filter values are being applied to this view.';
    const USE_GLOBAL = 'useGlobal';

    export default {
        inject: ['openmct', 'table'],
        data() {
            return {
                filterNames: [],
                filteredTelemetry: {}
            }           
        },
        computed: {
            filtersMixed() {
                let filtersToCompare = _.omit(this.filteredTelemetry[Object.keys(this.filteredTelemetry)[0]], [USE_GLOBAL]);
                let mixed = false;

                Object.values(this.filteredTelemetry).forEach(filters => {
                    if (!_.isEqual(filtersToCompare, _.omit(filters, [USE_GLOBAL]))) {
                        mixed = true;
                        return;
                    }
                });
                return mixed;
            },
            label() {
                if (this.filtersMixed) {
                    return FILTER_INDICATOR_LABEL_MIXED;
                } else {
                    return FILTER_INDICATOR_LABEL;
                }
            },
            title() {
                if (this.filtersMixed) {
                    return FILTER_INDICATOR_TITLE_MIXED;
                } else {
                    return FILTER_INDICATOR_TITLE;
                }
            }
        },
        methods: {
            isTelemetryObject(domainObject) {
                return domainObject.hasOwnProperty('telemetry');
            },
            setFilterNames() {
                let names = [];

                this.composition && this.composition.load().then((domainObjects) => {
                    domainObjects.forEach(telemetryObject => {
                        let keyString= this.openmct.objects.makeKeyString(telemetryObject.identifier);
                        let filters = this.filteredTelemetry[keyString];
                        let metadataValues = this.openmct.telemetry.getMetadata(telemetryObject).values();

                        if (filters !== undefined) {
                            this.collectFiltersName(_.omit(filters, [USE_GLOBAL]), metadataValues, names);
                        }
                    });
                    this.filterNames = Array.from(new Set(names));
                });
            },
            collectFiltersName(filters, metadataValues, names) {
                Object.keys(filters).forEach(key => {
                    if (!_.isEmpty(filters[key])) {
                        metadataValues.forEach(metadatum => {
                            if (key === metadatum.key) {
                                if (typeof metadatum.filters[0] === "object") {
                                    this.readFilterLabels(filters[key], metadatum, names);
                                } else {
                                    names.push(metadatum.name);
                                }
                            }
                        });
                    }
                });
            },
            readFilterLabels(filterObject, metadatum, names) {
                Object.values(filterObject).forEach(comparator => {
                    comparator.forEach(filterValue => {
                        metadatum.filters[0].possibleValues.forEach(option => {
                            if (option.value === filterValue) {
                                names.push(option.label);
                            }
                        });
                    });
                });
            },
            handleConfigurationChanges(configuration) {
                if (!_.eq(this.filteredTelemetry, configuration.filters)) {
                    this.updateFilters(configuration.filters || {});
                }
            },
            updateFilters(filters) {
                this.filteredTelemetry = JSON.parse(JSON.stringify(filters));
                this.setFilterNames();
            },
            addChildren(child) {
                let keyString = this.openmct.objects.makeKeyString(child.identifier);
                this.telemetryKeyStrings.add(keyString);
            },
            removeChildren(identifier) {
                let keyString = this.openmct.objects.makeKeyString(identifier);
                this.telemetryKeyStrings.delete(keyString);
            }
        },
        mounted() {
            let filters = this.table.configuration.getConfiguration().filters || {};
            this.telemetryKeyStrings = new Set();
            this.composition = this.openmct.composition.get(this.table.configuration.domainObject);

            if (this.composition) {
                this.composition.on('add', this.addChildren);
                this.composition.on('remove', this.removeChildren);
            }

            this.table.configuration.on('change', this.handleConfigurationChanges);
            this.updateFilters(filters);
        },
        destroyed() {
            this.table.configuration.off('change', this.handleConfigurationChanges);

            if (this.composition) {
                this.composition.off('add', this.addChildren);
                this.composition.off('remove', this.removeChildren);
            }
        }
    }
</script>
