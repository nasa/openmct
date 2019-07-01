<template>
    <div v-if="filterNames.length > 0"
        :title=title
        class="c-filter-indication"
        :class="{ 'c-filter-indication--mixed': mixed }">
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
            font-weight: bold;
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

    export default {
        inject: ['openmct', 'table'],
        data() {
            return {
                filterNames: [],
                filteredTelemetry: {},
                mixed: false,
                label: '',
                title: ''
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
                        this.telemetryKeyStrings.add(keyString);

                        if (filters !== undefined) {
                            let metadataValues = this.openmct.telemetry.getMetadata(telemetryObject).values();
                            Object.keys(filters).forEach(key => {
                                metadataValues.forEach(metadaum => {

                                    if (key === metadaum.key) {
                                        names.push(metadaum.name);
                                    }
                                });
                            });
                        }
                    });
                    this.filterNames = Array.from(new Set(names));
                });
            },
            handleConfigurationChanges(configuration) {
                if (!_.eq(this.filteredTelemetry, configuration.filters)) {
                    this.updateFilters(configuration.filters || {});
                }
            },
            checkFiltersForMixedValues() {
                let valueToCompare = this.filteredTelemetry[Object.keys(this.filteredTelemetry)[0]];
                let mixed = false;

                Object.values(this.filteredTelemetry).forEach(value => {
                    if (!_.isEqual(valueToCompare, value)) {
                        mixed = true;
                        return;
                    }
                });

                // If the filtered telemetry is not mixed at this point, check the number of available objects
                // with the number of filtered telemetry. If they are not equal, the filters must be mixed.
                if (mixed === false && _.size(this.filteredTelemetry) !== this.telemetryKeyStrings.size) {
                    mixed = true;
                }

                this.mixed = mixed;
            },
            setLabels() {
                if (this.mixed) {
                    this.label = FILTER_INDICATOR_LABEL_MIXED;
                    this.title = FILTER_INDICATOR_TITLE_MIXED;
                } else {
                    this.label = FILTER_INDICATOR_LABEL;
                    this.title = FILTER_INDICATOR_TITLE;
                }
            },
            updateFilters(filters) {
                this.filteredTelemetry = JSON.parse(JSON.stringify(filters));
                this.setFilterNames();
                this.updateIndicatorLabel();
            },
            addChildren(child) {
                let keyString = this.openmct.objects.makeKeyString(child.identifier);
                this.telemetryKeyStrings.add(keyString);
                this.updateIndicatorLabel();
            },
            removeChildren(identifier) {
                let keyString = this.openmct.objects.makeKeyString(identifier);
                this.telemetryKeyStrings.delete(keyString);
                this.updateIndicatorLabel();
            },
            updateIndicatorLabel() {
                this.checkFiltersForMixedValues();
                this.setLabels();
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
