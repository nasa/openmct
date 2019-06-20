<template>
    <div v-if="filterNames.length > 0" style="background-color: teal; color: white;">
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
                telemetryFilters: {}
            }           
        },
        methods: {
            isTelemetryObject(domainObject) {
                return domainObject.hasOwnProperty('telemetry');
            },
            getFilterNames() {
                let names = [];
                let composition = this.openmct.composition.get(this.table.domainObject);

                composition.load().then((domainObjects) => {
                    domainObjects.forEach(telemetryObject => {
                        let keyString= this.openmct.objects.makeKeyString(telemetryObject.identifier);
                        let metadataKeys = this.telemetryFilters[keyString];

                        if (metadataKeys !== undefined) {
                            let metadataValues = this.openmct.telemetry.getMetadata(telemetryObject).values();

                            Object.keys(metadataKeys).forEach(key => {
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
                    let filters = configuration.filters || {};
                    this.telemetryFilters = JSON.parse(JSON.stringify(filters));
                    this.getFilterNames();    
                }
            }
        },
        mounted() {
            let filters = this.table.configuration.getConfiguration().filters || {};
            this.telemetryFilters = JSON.parse(JSON.stringify(filters));
            this.getFilterNames();
            this.table.configuration.on('change', this.handleConfigurationChanges);
        },
        destroyed() {
            this.table.configuration.off('change', this.handleConfigurationChanges);
        }
    }
</script>
