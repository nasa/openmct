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
<ScatterPlotWithUnderlay
    class="c-plot c-scatter-chart-view"
    :data="trace"
    :plot-axis-title="plotAxisTitle"
/>
</template>

<script>
import ScatterPlotWithUnderlay from './ScatterPlotWithUnderlay.vue';

export default {
    components: {
        ScatterPlotWithUnderlay
    },
    inject: ['openmct', 'domainObject', 'path'],
    data() {
        this.telemetryObjects = {};
        this.telemetryObjectFormats = {};
        this.telemetryCollections = {};
        this.valuesByTimestamp = {};

        return {
            trace: []
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
        this.setTimeContext();
        this.loadComposition();
        this.reloadTelemetry = this.reloadTelemetry.bind(this);
        this.unobserve = this.openmct.objects.observe(this.domainObject, 'configuration.axes', this.reloadTelemetry);
    },
    beforeDestroy() {
        this.stopFollowingTimeContext();

        Object.keys(this.telemetryCollections).forEach(this.removeTelemetryCollection);
        if (!this.composition) {
            return;
        }

        this.composition.off('add', this.addTelemetryObject);
        this.composition.off('remove', this.removeTelemetryObject);
        if (this.unobserve) {
            this.unobserve();
        }
    },
    methods: {
        setTimeContext() {
            this.stopFollowingTimeContext();

            this.timeContext = this.openmct.time.getContextForView(this.path);
            this.followTimeContext();

        },
        followTimeContext() {
            this.timeContext.on('bounds', this.reloadTelemetry);
        },
        stopFollowingTimeContext() {
            if (this.timeContext) {
                this.timeContext.off('bounds', this.reloadTelemetry);
            }
        },
        addTelemetryObject(telemetryObject) {
            // grab information we need from the added telmetry object
            const key = this.openmct.objects.makeKeyString(telemetryObject.identifier);
            this.telemetryObjects[key] = telemetryObject;
            const metadata = this.openmct.telemetry.getMetadata(telemetryObject);
            this.telemetryObjectFormats[key] = this.openmct.telemetry.getFormatMap(metadata);
            this.addTelemetryCollection(key);
        },
        getTelemetryProcessor(keyString) {
            return (telemetry) => {
                //Check that telemetry object has not been removed since telemetry was requested.
                const telemetryObject = this.telemetryObjects[keyString];
                if (!telemetryObject) {
                    return;
                }

                telemetry.forEach(datum => {
                    this.addDataToGraph(telemetryObject, datum);
                });
                this.updateTrace(telemetryObject);
            };
        },
        getAxisMetadata(telemetryObject) {
            const metadata = this.openmct.telemetry.getMetadata(telemetryObject);
            if (!metadata) {
                return {};
            }

            return metadata.valuesForHints(['range']);
        },
        loadComposition() {
            this.composition = this.openmct.composition.get(this.domainObject);
            this.composition.on('add', this.addTelemetryObject);
            this.composition.on('remove', this.removeTelemetryObject);
            this.composition.load();
        },
        reloadTelemetry() {
            Object.keys(this.telemetryCollections).forEach(key => {
                this.removeTelemetryCollection(key);
            });

            this.valuesByTimestamp = {};

            Object.keys(this.telemetryObjects).forEach(key => {
                this.addTelemetryCollection(key);
            });
        },
        addTelemetryCollection(key) {
            const telemetryObject = this.telemetryObjects[key];
            if (!telemetryObject) {
                return;
            }

            // this.telemetryCollections[key] = this.openmct.telemetry
            //     .requestCollection(telemetryObject);

            const telemetryProcessor = this.getTelemetryProcessor(key);
            this.openmct.telemetry.request(telemetryObject).then(telemetryProcessor);
            // this.telemetryCollections[key].on('remove', telemetryRemover);
            // this.telemetryCollections[key].on('add', telemetryProcessor);
            // // this.telemetryCollections[key].on('clear', this.clearData);
            // this.telemetryCollections[key].load();
        },
        removeTelemetryCollection(keyString) {
            if (this.telemetryCollections[keyString]) {
                this.telemetryCollections[keyString].destroy();
                this.telemetryCollections[keyString] = undefined;
                delete this.telemetryCollections[keyString];
            }
        },
        removeTelemetryObject(identifier) {
            const key = this.openmct.objects.makeKeyString(identifier);
            delete this.telemetryObjects[key];
            if (this.telemetryObjectFormats && this.telemetryObjectFormats[key]) {
                delete this.telemetryObjectFormats[key];
            }

            this.removeTelemetryCollection(key);
        },
        addDataToGraph(telemetryObject, data) {
            const key = this.openmct.objects.makeKeyString(telemetryObject.identifier);

            if (data.message) {
                this.openmct.notifications.alert(data.message);
            }

            if (!this.domainObject.configuration.axes.xKey || !this.domainObject.configuration.axes.yKey) {
                return;
            }

            const timestamp = this.getTimestampForDatum(data, key, telemetryObject);
            let valueForTimestamp = this.valuesByTimestamp[timestamp] || {};

            //populate x values
            let metadataKey = this.domainObject.configuration.axes.xKey;
            if (data[metadataKey] !== undefined) {
                valueForTimestamp.x = this.format(key, metadataKey, data);
            }

            metadataKey = this.domainObject.configuration.axes.yKey;
            if (data[metadataKey] !== undefined) {
                valueForTimestamp.y = this.format(key, metadataKey, data);
            }

            this.valuesByTimestamp[timestamp] = valueForTimestamp;
        },
        updateTrace(telemetryObject) {
            const xAndyValues = Object.values(this.valuesByTimestamp);
            const xValues = xAndyValues.map(value => value.x);
            const yValues = xAndyValues.map(value => value.y);
            const axisMetadata = this.getAxisMetadata(telemetryObject);
            const xAxisMetadata = axisMetadata.find(metadata => metadata.source === this.domainObject.configuration.axes.xKey);
            let yAxisMetadata = {};
            if (this.domainObject.configuration.axes.yKey) {
                yAxisMetadata = axisMetadata.find(metadata => metadata.source === this.domainObject.configuration.axes.yKey);
            }

            let trace = {
                key: this.openmct.objects.makeKeyString(this.domainObject.identifier),
                name: this.domainObject.name,
                x: xValues,
                y: yValues,
                text: yValues.map(String),
                xAxisMetadata: xAxisMetadata,
                yAxisMetadata: yAxisMetadata,
                type: 'scatter',
                mode: 'markers',
                marker: {
                    color: this.domainObject.configuration.styles.color
                },
                hoverinfo: 'x+y'
            };

            if (this.domainObject.configuration.domainMin !== undefined && this.domainObject.configuration.domainMax !== undefined) {
                trace.xaxis = {
                    min: this.domainObject.configuration.domainMin,
                    max: this.domainObject.configuration.domainMax
                };
            }

            if (this.domainObject.configuration.rangeMin !== undefined && this.domainObject.configuration.rangeMax !== undefined) {
                trace.yaxis = {
                    min: this.domainObject.configuration.rangeMin,
                    max: this.domainObject.configuration.rangeMax
                };
            }

            this.trace = [trace];
        },
        getTimestampForDatum(datum, key, telemetryObject) {
            const timeSystemKey = this.timeContext.timeSystem().key;
            const metadata = this.openmct.telemetry.getMetadata(telemetryObject);
            let metadataValue = metadata.value(timeSystemKey) || { format: timeSystemKey };

            return this.parse(key, metadataValue.source, datum);
        },
        format(telemetryObjectKey, metadataKey, data) {
            const formats = this.telemetryObjectFormats[telemetryObjectKey];

            return formats[metadataKey].format(data);
        },
        parse(telemetryObjectKey, metadataKey, datum) {
            if (!datum) {
                return;
            }

            const formats = this.telemetryObjectFormats[telemetryObjectKey];

            return formats[metadataKey].parse(datum);
        }
    }
};

</script>
