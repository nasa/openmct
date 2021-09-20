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
<BarGraph ref="barGraph"
          class="c-plot c-bar-chart-view"
          :data="trace"
          :plot-axis-title="plotAxisTitle"
          v-on="{ [SUBSCRIBE]: subscribeToAll,
                  [UNSUBSCRIBE]: removeAllSubscriptions,
          }"
/>
</template>

<script>
import { SUBSCRIBE, UNSUBSCRIBE } from './BarGraphConstants';
import BarGraph from './BarGraphPlot.vue';

export default {
    components: {
        BarGraph
    },
    inject: ['openmct', 'domainObject'],
    data() {
        return {
            composition: {},
            currentDomainObject: this.domainObject,
            subscriptions: [],
            telemetryObjects: {},
            trace: [],
            SUBSCRIBE,
            UNSUBSCRIBE
        };
    },
    computed: {
        plotAxisTitle() {
            const { xAxisMetadata = {}, yAxisMetadata = {} } = this.trace[0] || {};
            const xAxisUnit = xAxisMetadata.units ? `(${xAxisMetadata.units})` : '';
            const yAxisUnit = yAxisMetadata.units ? `(${yAxisMetadata.units})` : '';

            return {
                xAxisTitle: `${xAxisMetadata.name || ''} ${xAxisUnit}`,
                yAxisTitle: `${yAxisMetadata.name || ''} ${yAxisUnit}`
            };
        }
    },
    mounted() {
        this.loadComposition();

        this.openmct.time.on('bounds', this.refreshData);
    },
    beforeDestroy() {
        this.$refs.barGraph.$off();
        this.openmct.time.off('bounds', this.refreshData);

        this.removeAllSubscriptions();

        if (!this.composition) {
            return;
        }

        this.composition.off('add', this.addTelemetryObject);
        this.composition.off('remove', this.removeTelemetryObject);
    },
    methods: {
        addTelemetryObject(telemetryObject) {
            const key = this.openmct.objects.makeKeyString(telemetryObject.identifier);
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
        },
        getAxisMetadata(telemetryObject) {
            const metadata = this.openmct.telemetry.getMetadata(telemetryObject);
            const yAxisMetadata = metadata.valuesForHints(['range'])[0];
            //Exclude 'name' and 'time' based metadata specifically, from the x-Axis values by using range hints only
            const xAxisMetadata = metadata.valuesForHints(['range']);

            return {
                xAxisMetadata,
                yAxisMetadata
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
                const telemetryObjects = Object.values(this.telemetryObjects);
                telemetryObjects.forEach(this.requestDataFor);
            }
        },
        removeAllSubscriptions() {
            this.subscriptions.forEach(subscription => subscription.unsubscribe());
            this.subscriptions = [];
        },
        removeSubscription(key) {
            const found = this.subscriptions.findIndex(subscription => subscription.key === key);
            if (found > -1) {
                this.subscriptions[found].unsubscribe();
                this.subscriptions.splice(found, 1);
            }
        },
        removeTelemetryObject(identifier) {
            const key = this.openmct.objects.makeKeyString(identifier);
            delete this.telemetryObjects[key];
            if (this.domainObject.configuration.barStyles.series[key]) {
                delete this.domainObject.configuration.barStyles.series[key];
            }

            this.removeSubscription(key);

            this.trace = this.trace.filter(t => t.key !== key);
        },
        addDataToPlot(telemetryObject, data, axisMetadata) {
            const key = this.openmct.objects.makeKeyString(telemetryObject.identifier);

            if (data.message) {
                this.openmct.notifications.alert(data.message);
            }

            let xValues = [];
            let yValues = [];

            //populate X and Y values for plotly
            axisMetadata.xAxisMetadata.forEach((metadata) => {
                xValues.push(metadata.name);
                if (data[metadata.key]) {
                    //TODO: Format the data?
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
                text: yValues.map(String),
                xAxisMetadata: axisMetadata.xAxisMetadata,
                yAxisMetadata: axisMetadata.yAxisMetadata,
                type: 'bar',
                marker: {
                    color: this.domainObject.configuration.barStyles.series[key].color
                },
                hoverinfo: 'skip'
            };

            this.addTrace(trace, key);
        },
        requestDataFor(telemetryObject) {
            const axisMetadata = this.getAxisMetadata(telemetryObject);
            this.openmct.telemetry.request(telemetryObject)
                .then(data => {
                    data.forEach((datum) => {
                        this.addDataToPlot(telemetryObject, datum, axisMetadata);
                    });
                });
        },
        subscribeToObject(telemetryObject) {
            const key = this.openmct.objects.makeKeyString(telemetryObject.identifier);

            this.removeSubscription(key);

            const axisMetadata = this.getAxisMetadata(telemetryObject);

            const unsubscribe = this.openmct.telemetry.subscribe(telemetryObject,
                data => this.addDataToPlot(telemetryObject, data, axisMetadata));

            this.subscriptions.push({
                key,
                unsubscribe
            });
        },
        subscribeToAll() {
            const telemetryObjects = Object.values(this.telemetryObjects);
            telemetryObjects.forEach(this.subscribeToObject);
        }
    }
};

</script>
