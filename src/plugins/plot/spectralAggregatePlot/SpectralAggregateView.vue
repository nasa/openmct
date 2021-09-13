<!--
 Open MCT, Copyright (c) 2014-2021, United States Government
 as represented by the Administrator of the National Aeronautics and Space
 Administration. All rights reserved.

 Open MCT is licensed under the Apache License, Version 2.0 (the
 "License"); you may not use this file except in compliance with the License.
 You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0.

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 License for the specific language governing permissions and limitations
 under the License.

 Open MCT includes source code licensed under additional open source
 licenses. See the Open Source Licenses file (LICENSES.md) included with
 this source code distribution or the Licensing information page available
 at runtime from the About dialog for additional information.
-->

<template>
<div class="c-spectral-aggregate-plot-view gl-plot plot-legend-bottom"
     :class="{'plot-legend-expanded': legendExpanded, 'plot-legend-collapsed': !legendExpanded }"
>
    <SpectralAggregatePlot ref="spectralAggregatePlot"
                           class="c-spectral-aggregate-plot__plot-wrapper"
                           :data="visibleData"
                           :plot-axis-title="plotAxisTitle"
                           :legend-expanded="legendExpanded"
    />
</div>
</template>

<script>
import * as SPECTRAL_AGGREGATE from './SpectralAggregateConstants';
import ColorPalette from '../lib/ColorPalette';
import objectUtils from 'objectUtils';
import SpectralAggregatePlot from './SpectralAggregatePlot.vue';

export default {
    components: {
        SpectralAggregatePlot
    },
    inject: ['openmct', 'domainObject'],
    data() {
        return {
            colorMapping: {},
            composition: {},
            currentDomainObject: this.domainObject,
            isRealTime: (this.openmct.time.clock() !== undefined),
            spectralAggregateTypes: {},
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

        this.$refs.spectralAggregatePlot.$on(SPECTRAL_AGGREGATE.SUBSCRIBE, this.subscribeToAll);
        this.$refs.spectralAggregatePlot.$on(SPECTRAL_AGGREGATE.UNSUBSCRIBE, this.removeAllSubscriptions);

        this.unobserve = this.openmct.objects.observe(this.currentDomainObject, '*', this.updateDomainObject);
    },
    beforeDestroy() {
        this.$refs.spectralAggregatePlot.$off();
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
            const color = this.colorPalette.getNextColor().asHexString();
            this.colorMapping[key] = color;

            return color;
        },
        addSpectralAggregateType(key, name, timestamp, color) {
            this.$set(this.spectralAggregateTypes, key, {
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
            const yAxisMetadata = metadata.valuesForHints(['range'])[0];
            //Exclude 'name' and 'time' based metadata from the x-Axis values
            const xAxisMetadata = metadata.valueMetadatas.filter((valueMetadata => {
                return valueMetadata.key !== 'name' && !this.openmct.time.getAllTimeSystems().find((timeSystem) => timeSystem.key === valueMetadata.key);
            }));

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
            this.$delete(this.spectralAggregateTypes, key);

            this.subscriptions.forEach(subscription => {
                if (subscription.key !== key) {
                    return;
                }

                subscription.unsubscribe();
                delete this.subscriptions[key];
            });

            this.trace = this.trace.filter(t => t.key !== key);
        },
        processData(telemetryObject, data, axisMetadata) {
            const key = objectUtils.makeKeyString(telemetryObject.identifier);

            const formattedTimestamp = 'N/A';

            const color = this.colorMapping[key];
            const spectralAggregateValue = this.spectralAggregateTypes[key];
            if (!spectralAggregateValue) {
                this.addSpectralAggregateType(key, telemetryObject.name, formattedTimestamp, color);
            }

            if (data.message) {
                this.openmct.notifications.alert(data.message);
            }

            let xValues = [];
            let yValues = [];

            //populate X and Y values for plotly
            axisMetadata.xAxisMetadata.forEach((metadata) => {
                xValues.push(metadata.name);
                if (data[metadata.key]) {
                    yValues.push(data[metadata.key]);
                } else {
                    yValues.push('');
                }
            });

            const trace = {
                key,
                name: telemetryObject.name,
                x: xValues,
                y: yValues,
                xAxisMetadata: axisMetadata.xAxisMetadata,
                yAxisMetadata: axisMetadata.yAxisMetadata,
                type: 'bar'
            };

            this.addTrace(trace, key);
        },
        requestDataFor(telemetryObject) {
            const axisMetadata = this.getAxisMetadata(telemetryObject);
            this.openmct.telemetry.request(telemetryObject, this.getOptions(telemetryObject))
                .then(data => {
                    data.forEach((datum) => {
                        this.processData(telemetryObject, datum, axisMetadata);
                    });
                });
        },
        subscribeToObject(telemetryObject) {
            const key = objectUtils.makeKeyString(telemetryObject.identifier);
            const found = Object.values(this.subscriptions).findIndex(objectKey => objectKey === key);
            if (found > -1) {
                this.subscriptions[found].unsubscribe();
                delete this.subscriptions[found];
            }

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
        updateDomainObject(newDomainObject) {
            this.currentDomainObject = newDomainObject;
        },
        updateTraceVisibility() {
            // We create a copy here to improve performance since visibleData - a computed property - is dependent on this.trace.
            this.trace = this.trace.map((currentTrace, index) => {
                currentTrace.hidden = this.spectralAggregateTypes[currentTrace.key].hidden === true;

                return currentTrace;
            });
        }
    }
};

</script>

<style lang="scss">
    .c-spectral-aggregate-plot {
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
