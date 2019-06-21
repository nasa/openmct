<template>
    <div v-if="filterNames.length > 0" style="background-color: teal; color: white;">
        <span v-if="mixed">Mixed-</span>
        <span v-for="(name, index) in filterNames">
            {{name}}
            <span v-if="index < filterNames.length - 1">,</span>
        </span>
    </div>
</template>

<script>
    export default {
        inject: ['openmct', 'table'],
        data() {
            return {
                filterNames: [],
                telemetryFilters: {},
                mixed: false
            }           
        },
        methods: {
            isTelemetryObject(domainObject) {
                return domainObject.hasOwnProperty('telemetry');
            },
            setFilterNames() {
                let names = [];
                let composition = this.openmct.composition.get(this.table.configuration.domainObject);

                composition.load().then((domainObjects) => {
                    domainObjects.forEach(telemetryObject => {
                        let keyString= this.openmct.objects.makeKeyString(telemetryObject.identifier);
                        let filters = this.telemetryFilters[keyString];

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
                if (!_.eq(this.telemetryFilters, configuration.filters)) {
                    this.updateFilters(configuration.filters || {});
                }
            },
            checkFiltersForMixedValues() {
                let valueToCompare = this.telemetryFilters[Object.keys(this.telemetryFilters)[0]];
                let mixed = false;
                Object.values(this.telemetryFilters).forEach(value => {
                    if (!_.isEqual(valueToCompare, value)) {
                        mixed = true;
                        return;
                    }
                });
                this.mixed = mixed;
            },
            updateFilters(filters) {
                this.telemetryFilters = JSON.parse(JSON.stringify(filters));
                this.setFilterNames();
                this.checkFiltersForMixedValues();
            }
        },
        mounted() {
            let filters = this.table.configuration.getConfiguration().filters || {};
            this.table.configuration.on('change', this.handleConfigurationChanges);
            this.updateFilters(filters);
        },
        destroyed() {
            this.table.configuration.off('change', this.handleConfigurationChanges);
        }
    }
</script>
