<template>
<div
    class="c-table-indicator"
    :class="{ 'is-filtering': filterNames.length > 0 }"
>
    <div
        v-if="filterNames.length > 0"
        class="c-table-indicator__filter c-table-indicator__elem c-filter-indication"
        :class="{ 'c-filter-indication--mixed': hasMixedFilters }"
        :title="title"
    >
        <span class="c-filter-indication__mixed">{{ label }}</span>
        <span
            v-for="(name, index) in filterNames"
            :key="index"
            class="c-filter-indication__label"
        >
            {{ name }}
        </span>
    </div>

    <div class="c-table-indicator__counts">
        <span
            :title="totalRows + ' rows visible after any filtering'"
            class="c-table-indicator__elem c-table-indicator__row-count"
        >
            {{ totalRows }} Rows
        </span>

        <span
            v-if="markedRows"
            class="c-table-indicator__elem c-table-indicator__marked-count"
            :title="markedRows + ' rows selected'"
        >
            {{ markedRows }} Marked
        </span>

    </div>
</div>
</template>

<script>
import _ from 'lodash';

const FILTER_INDICATOR_LABEL = 'Filters:';
const FILTER_INDICATOR_LABEL_MIXED = 'Mixed Filters:';
const FILTER_INDICATOR_TITLE = 'Data filters are being applied to this view.';
const FILTER_INDICATOR_TITLE_MIXED = 'A mix of data filter values are being applied to this view.';
const USE_GLOBAL = 'useGlobal';

export default {
    inject: ['openmct', 'table'],
    props: {
        markedRows: {
            type: Number,
            default: 0
        },
        totalRows: {
            type: Number,
            default: 0
        }
    },
    data() {
        return {
            filterNames: [],
            filteredTelemetry: {}
        };
    },
    computed: {
        hasMixedFilters() {
            let filtersToCompare = _.omit(this.filteredTelemetry[Object.keys(this.filteredTelemetry)[0]], [USE_GLOBAL]);

            return Object.values(this.filteredTelemetry).some(filters => {
                return !_.isEqual(filtersToCompare, _.omit(filters, [USE_GLOBAL]));
            });
        },
        label() {
            if (this.hasMixedFilters) {
                return FILTER_INDICATOR_LABEL_MIXED;
            } else {
                return FILTER_INDICATOR_LABEL;
            }
        },
        title() {
            if (this.hasMixedFilters) {
                return FILTER_INDICATOR_TITLE_MIXED;
            } else {
                return FILTER_INDICATOR_TITLE;
            }
        }
    },
    mounted() {
        let filters = this.table.configuration.getConfiguration().filters || {};
        this.table.configuration.on('change', this.handleConfigurationChanges);
        this.updateFilters(filters);
    },
    destroyed() {
        this.table.configuration.off('change', this.handleConfigurationChanges);
    },
    methods: {
        setFilterNames() {
            let names = [];
            let composition = this.openmct.composition.get(this.table.configuration.domainObject);
            if (composition !== undefined) {
                composition.load().then((domainObjects) => {
                    domainObjects.forEach(telemetryObject => {
                        let keyString = this.openmct.objects.makeKeyString(telemetryObject.identifier);
                        let metadataValues = this.openmct.telemetry.getMetadata(telemetryObject).values();
                        let filters = this.filteredTelemetry[keyString];

                        if (filters !== undefined) {
                            names.push(this.getFilterNamesFromMetadata(filters, metadataValues));
                        }
                    });

                    names = _.flatten(names);
                    this.filterNames = names.length === 0 ? names : Array.from(new Set(names));
                });
            }
        },
        getFilterNamesFromMetadata(filters, metadataValues) {
            let filterNames = [];
            filters = _.omit(filters, [USE_GLOBAL]);

            Object.keys(filters).forEach(key => {
                if (!_.isEmpty(filters[key])) {
                    metadataValues.forEach(metadatum => {
                        if (key === metadatum.key) {
                            if (typeof metadatum.filters[0] === "object") {
                                filterNames.push(this.getFilterLabels(filters[key], metadatum));
                            } else {
                                filterNames.push(metadatum.name);
                            }
                        }
                    });
                }
            });

            return _.flatten(filterNames);
        },
        getFilterLabels(filterObject, metadatum) {
            let filterLabels = [];
            Object.values(filterObject).forEach(comparator => {
                comparator.forEach(filterValue => {
                    metadatum.filters[0].possibleValues.forEach(option => {
                        if (option.value === filterValue) {
                            filterLabels.push(option.label);
                        }
                    });
                });
            });

            return filterLabels;
        },
        handleConfigurationChanges(configuration) {
            if (!_.eq(this.filteredTelemetry, configuration.filters)) {
                this.updateFilters(configuration.filters || {});
            }
        },
        updateFilters(filters) {
            this.filteredTelemetry = JSON.parse(JSON.stringify(filters));
            this.setFilterNames();
        }
    }
};
</script>
