<template>
<div class="c-spectral-plot-view gl-plot plot-legend-bottom"
     :class="{'plot-legend-expanded': legendExpanded, 'plot-legend-collapsed': !legendExpanded }"
>
    <SpectralPlot ref="spectralPlot"
                  class="c-spectral-plot__plot-wrapper"
                  :data="visibleData"
                  :plot-axis-title="plotAxisTitle"
    />
</div>
</template>

<script>
import * as SPECTRAL from './spectral-constants';
import ColorPalette from '../lib/ColorPalette';
import objectUtils from 'objectUtils';
import SpectralPlot from './spectral-plot.vue';

export default {
    components: {
        SpectralPlot
    },
    inject: ['openmct', 'domainObject'],
    data() {
        return {
            colorMapping: {},
            composition: {},
            currentDomainObject: this.domainObject,
            isRealTime: (this.openmct.time.clock() !== undefined),
            spectralTypes: {},
            subscriptions: [],
            telemetryObjects: {},
            trace: [],
            legendExpanded: false
        };
    },
    computed: {
        activeClock() {
            return this.openmct.time.activeClock;
        },
        plotAxisTitle() {
            const { xAxisMetadata = {}, yAxisMetadata = {} } = this.trace[0] || {};
            const xAxisUnit = xAxisMetadata.units ? `(${xAxisMetadata.units})` : '';
            const yAxisUnit = yAxisMetadata.units ? `(${yAxisMetadata.units})` : '';

            return {
                xAxisTitle: `${xAxisMetadata.name || ''} ${xAxisUnit}`,
                yAxisTitle: `${yAxisMetadata.name || ''} ${yAxisUnit}`
            };
        },
        visibleData() {
            return this.trace.filter((trace) => trace.hidden !== true);
        }
    },
    mounted() {
        this.colorPalette = new ColorPalette();
        this.loadComposition();

        this.openmct.time.on('bounds', this.refreshData);
        this.openmct.time.on('clock', this.clockChanged);

        this.$refs.spectralPlot.$on(SPECTRAL.SUBSCRIBE, this.subscribeToAll);
        this.$refs.spectralPlot.$on(SPECTRAL.UNSUBSCRIBE, this.removeAllSubscriptions);

        this.unobserve = this.openmct.objects.observe(this.currentDomainObject, '*', this.updateDomainObject);
    },
    beforeDestroy() {
        this.$refs.spectralPlot.$off();
        this.openmct.time.off('bounds', this.refreshData);
        this.openmct.time.off('clock', this.clockChanged);

        this.removeAllSubscriptions();
        this.unobserve();

        if (!this.composition) {
            return;
        }

        this.composition.off('add', this.addTelemetryObject);
        this.composition.off('remove', this.removeTelemetryObject);
    },
    methods: {
        addColorForTelemetry(key) {
            const index = Object.keys(this.colorMapping).length;
            const color = this.colorPalette.getColor(index).asHexString();
            this.colorMapping[key] = color;

            return color;
        },
        addSpectralType(key, name, timestamp, color) {
            this.$set(this.spectralTypes, key, {
                name,
                timestamp,
                color
            });
        },
        addTelemetryObject(telemetryObject) {
            const key = objectUtils.makeKeyString(telemetryObject.identifier);

            if (!this.colorMapping[key]) {
                this.addColorForTelemetry(key);
            }

            this.telemetryObjects[key] = telemetryObject;

            this.updateAxisConfig();
            this.requestDataFor(telemetryObject);
            this.subscribeToObject(telemetryObject);
        },
        addTrace(trace, key) {
            if (!this.trace.length) {
                this.trace = this.trace.concat([trace]);

                return;
            }

            let isInTrace = false;
            const newTrace = this.trace.map((currentTrace, index) => {
                if (currentTrace.key !== key) {
                    return currentTrace;
                }

                isInTrace = true;

                return trace;
            });

            this.trace = isInTrace ? newTrace : newTrace.concat([trace]);
            this.updateTraceVisibility();
        },
        clockChanged() {
            this.isRealTime = this.openmct.time.clock() !== undefined;

            this.removeAllSubscriptions();
            this.subscribeToAll();
        },
        getAxisMetadata(telemetryObject) {
            const metadata = this.openmct.telemetry.getMetadata(telemetryObject);
            const xAxisMetadata = metadata.valuesForHints(['domain'])[0];
            const yAxisMetadata = metadata.valuesForHints(['range'])[0];

            return {
                xAxisMetadata,
                yAxisMetadata
            };
        },
        getOptions(telemetryObject) {
            const { start, end } = this.openmct.time.bounds();

            return {
                averages: 0,
                end,
                start,
                startTime: null,
                spectra: true
            };
        },
        loadComposition() {
            this.composition = this.openmct.composition.get(this.currentDomainObject);

            if (!this.composition) {
                this.addTelemetryObject(this.currentDomainObject);

                return;
            }

            this.composition.on('add', this.addTelemetryObject);
            this.composition.on('remove', this.removeTelemetryObject);
            this.composition.load();
        },
        refreshData(bounds, isTick) {
            if (!isTick) {
                this.colorPalette.reset();
                const telemetryObjects = Object.values(this.telemetryObjects);
                telemetryObjects.forEach(this.requestDataFor);
            }
        },
        removeAllSubscriptions() {
            this.subscriptions.forEach(subscription => subscription.unsubscribe());
            this.subscriptions = [];
        },
        removeTelemetryObject(identifier) {
            const key = objectUtils.makeKeyString(identifier);
            delete this.telemetryObjects[key];
            this.$delete(this.spectralTypes, key);

            this.subscriptions.forEach(subscription => {
                if (subscription.key !== key) {
                    return;
                }

                subscription.unsubscribe();
                delete this.subscriptions[key];
            });

            this.trace = this.trace.filter(t => t.key !== key);
            this.updateAxisConfig();
        },
        processData(telemetryObject, data, axisMetadata) {
            const key = objectUtils.makeKeyString(telemetryObject.identifier);

            const formattedTimestamp = 'N/A';

            const color = this.colorMapping[key];
            const spectralValue = this.spectralTypes[key];
            if (!spectralValue) {
                this.addSpectralType(key, telemetryObject.name, formattedTimestamp, color);
            }

            if (data.message) {
                this.openmct.notifications.alert(data.message);
            }

            if (!data.values) {
                return;
            }

            const trace = {
                key,
                name: telemetryObject.name,
                x: data.values && data.values.x || [],
                y: data.values && data.values.y || [],
                xAxisMetadata: axisMetadata.xAxisMetadata,
                yAxisMetadata: axisMetadata.yAxisMetadata,
                type: this.currentDomainObject.configuration && this.currentDomainObject.configuration.plotType ? this.currentDomainObject.configuration.plotType : 'scattergl',
                mode: "markers",
                marker: {
                    size: 1,
                    color
                }
            };

            trace.yaxis = this.trace.length > 1
                ? `y${axisMetadata.yAxisMetadata.hints.range}`
                : 'y1';

            this.addTrace(trace, key);
        },
        requestDataFor(telemetryObject) {
            const axisMetadata = this.getAxisMetadata(telemetryObject);
            this.openmct.telemetry.request(telemetryObject, this.getOptions(telemetryObject))
                .then(data => this.processData(telemetryObject, data, axisMetadata));
        },
        subscribeToObject(telemetryObject) {
            const key = objectUtils.makeKeyString(telemetryObject.identifier);
            const options = this.getOptions(telemetryObject);
            const axisMetadata = this.getAxisMetadata(telemetryObject);
            const unsubscribe = this.openmct.telemetry.subscribe(telemetryObject,
                data => this.processData(telemetryObject, data, axisMetadata)
                , options);

            this.subscriptions.push({
                key,
                unsubscribe
            });
        },
        subscribeToAll() {
            this.colorPalette.reset();
            const telemetryObjects = Object.values(this.telemetryObjects);
            telemetryObjects.forEach(this.subscribeToObject);
        },
        updateAxisConfig() {
            if (!this.spectralConfiguration) {
                return;
            }

            const configuration = JSON.parse(JSON.stringify(this.spectralConfiguration.getConfiguration()));
            const axisNameMapping = {};

            Object.entries(this.telemetryObjects).forEach(([key, telemetryObject]) => {
                const {
                    xAxisMetadata,
                    yAxisMetadata
                } = this.getAxisMetadata(telemetryObject);

                configuration.xAxis.name = xAxisMetadata.name;
                configuration.xAxis.disabled = false;

                const range = yAxisMetadata.hints.range.toString();
                axisNameMapping[range] = yAxisMetadata.name;
            });

            Object.values(configuration).forEach(config => {
                if (!Object.keys(this.telemetryObjects).length) {
                    config.name = '';
                    config.disabled = true;
                }

                const type = config.type;
                if (!type) {
                    return;
                }

                const name = axisNameMapping[type];
                config.disabled = !name;
                config.name = name || '';
            });

            this.spectralConfiguration.updateConfiguration(configuration);
        },
        updateDomainObject(newDomainObject) {
            this.currentDomainObject = newDomainObject;
        },
        updateTraceVisibility() {
            // We create a copy here to improve performance since visibleData - a computed property - is dependent on this.trace.
            this.trace = this.trace.map((currentTrace, index) => {
                currentTrace.hidden = this.spectralTypes[currentTrace.key].hidden === true;

                return currentTrace;
            });
        }
    }
};

</script>

<style lang="scss">
    .c-spectral-plot {
        > * + * {
            margin-top: 5px;
        }

        &-view {
            display: flex;
            flex-direction: column;
            overflow: hidden;
        }

        &__plot-wrapper {
            flex: 1 1 auto;
            min-height: 300px;
            min-width: 300px;
        }

        &__legend-wrapper {
            flex: 0 1 auto;
            overflow: auto;
            padding-right: 5px;
        }
    }
</style>
