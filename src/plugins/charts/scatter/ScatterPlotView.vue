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

const MAX_INTERPOLATE = 5;

export default {
    components: {
        ScatterPlotWithUnderlay
    },
    inject: ['openmct', 'domainObject', 'path'],
    data() {
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
        this.telemetryObjects = {};
        this.telemetryObjectFormats = {};
        this.telemetryCollections = {};
        this.valuesByTimestamp = {};
        this.setTimeContext();
        this.loadComposition();
        this.unobserve = this.openmct.objects.observe(this.domainObject, 'configuration.axes', this.reloadTelemetry);
        this.unobserveInterpolation = this.openmct.objects.observe(this.domainObject, 'configuration.useInterpolation', this.reloadTelemetry);
    },
    beforeDestroy() {
        Object.keys(this.telemetryCollections).forEach(this.removeTelemetryCollection);
        if (!this.composition) {
            return;
        }

        this.composition.off('add', this.addTelemetryObject);
        this.composition.off('remove', this.removeTelemetryObject);
        if (this.unobserve) {
            this.unobserve();
        }

        if (this.unobserveInterpolation) {
            this.unobserveInterpolation();
        }
    },
    methods: {
        setTimeContext() {
            this.timeContext = this.openmct.time.getContextForView(this.path);
        },
        addTelemetryObject(telemetryObject) {
            // grab information we need from the added telmetry object
            const key = this.openmct.objects.makeKeyString(telemetryObject.identifier);
            this.telemetryObjects[key] = telemetryObject;
            const metadata = this.openmct.telemetry.getMetadata(telemetryObject);
            this.telemetryObjectFormats[key] = this.openmct.telemetry.getFormatMap(metadata);
            if (key === this.domainObject.configuration.axes.xKey || key === this.domainObject.configuration.axes.yKey) {
                this.addTelemetryCollection(key);
            }
        },
        getTelemetryProcessor(keyString) {
            return (telemetry) => {
                //Check that telemetry object has not been removed since telemetry was requested.
                const telemetryObject = this.telemetryObjects[keyString];
                if (!telemetryObject) {
                    return;
                }

                const axisMetadata = this.getAxisMetadata(telemetryObject);
                telemetry.forEach(datum => {
                    this.addDataToGraph(telemetryObject, datum, axisMetadata);
                });
                this.updateTrace();
            };
        },
        getAxisMetadata(telemetryObject) {
            const metadata = this.openmct.telemetry.getMetadata(telemetryObject);
            if (!metadata) {
                return {};
            }

            return metadata.valuesForHints(['range'])[0];
        },
        loadComposition() {
            this.composition = this.openmct.composition.get(this.domainObject);
            this.composition.on('add', this.addTelemetryObject);
            this.composition.on('remove', this.removeTelemetryObject);
            this.composition.load();
        },
        reloadTelemetry() {
            const axes = this.domainObject.configuration.axes;
            const xKey = axes.xKey;
            const yKey = axes.yKey;
            Object.keys(this.telemetryCollections).forEach(key => {
                this.removeTelemetryCollection(key);
            });

            this.valuesByTimestamp = {};

            this.addTelemetryCollection(xKey);
            this.addTelemetryCollection(yKey);
        },
        addTelemetryCollection(key) {
            const telemetryObject = this.telemetryObjects[key];
            if (!telemetryObject) {
                return;
            }

            this.telemetryCollections[key] = this.openmct.telemetry
                .requestCollection(telemetryObject);

            const telemetryProcessor = this.getTelemetryProcessor(key);
            // this.telemetryCollections[key].on('remove', telemetryRemover);
            this.telemetryCollections[key].on('add', telemetryProcessor);
            // this.telemetryCollections[key].on('clear', this.clearData);
            this.telemetryCollections[key].load();
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
            if (this.domainObject.configuration.axes.xKey === key || this.domainObject.configuration.axes.yKey === key) {
                this.reloadTelemetry();
            }
        },
        addDataToGraph(telemetryObject, data, axisMetadata) {
            const key = this.openmct.objects.makeKeyString(telemetryObject.identifier);

            if (data.message) {
                this.openmct.notifications.alert(data.message);
            }

            if (!this.domainObject.configuration.axes.xKey) {
                return;
            }

            const timestamp = this.getTimestampForDatum(data, key, telemetryObject);
            let valueForTimestamp = this.valuesByTimestamp[timestamp] || {};

            if (this.domainObject.configuration.axes.xKey === key) {
                //populate x values
                const metadataKey = axisMetadata.source;
                if (data[metadataKey]) {
                    valueForTimestamp.x = this.format(key, metadataKey, data);
                    // this.interpolateValues(valueForTimestamp, timestamp, 'x', 'y');
                }
            } else if (this.domainObject.configuration.axes.yKey === key) {
                // const metadataKey = axisMetadata.source;
                // if (data[metadataKey]) {
                //     valueForTimestamp.y = this.format(key, metadataKey, data);
                //     this.interpolateValues(valueForTimestamp, timestamp, 'y', 'x');
                // }
            }

            this.valuesByTimestamp[timestamp] = valueForTimestamp;
        },
        updateTrace() {
            const xAndyValues = Object.values(this.valuesByTimestamp);
            const xValues = Object.keys(this.valuesByTimestamp);
            const yValues = xAndyValues.map(value => value.x);
            // const xValues = xAndyValues.map(value => value.time);
            const xAxisMetadata = this.getAxisMetadata(this.telemetryObjects[this.domainObject.configuration.axes.xKey]);
            let yAxisMetadata = {};
            if (this.domainObject.configuration.axes.yKey) {
                yAxisMetadata = this.getAxisMetadata(this.telemetryObjects[this.domainObject.configuration.axes.yKey]);
            }

            let trace = {
                key: this.openmct.objects.makeKeyString(this.domainObject.identifier),
                name: this.domainObject.name,
                x: xValues,
                y: yValues,
                text: yValues.map(String),
                xAxisMetadata: xAxisMetadata,
                yAxisMetadata: xAxisMetadata,
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
        interpolateValues(valueForTimestamp, timestamp, adjustProp, interpolateProp) {
            if (this.domainObject.configuration.useInterpolation !== true) {
                valueForTimestamp[`${adjustProp}Interpolated`] = false;

                return;
            }

            this.adjustInterpolatedValues(timestamp, adjustProp, valueForTimestamp[adjustProp]);
            if (valueForTimestamp[interpolateProp] === undefined) {
                //find nearest y
                valueForTimestamp[interpolateProp] = this.getInterpolatedValue(timestamp, interpolateProp);
                valueForTimestamp[`${interpolateProp}Interpolated`] = true;
            }
        },
        getInterpolatedValue(timestamp, prop) {
            const keys = Object.keys(this.valuesByTimestamp);
            const keysLength = keys.length;
            const values = Object.values(this.valuesByTimestamp);
            let index = keys.findIndex(item => {
                return parseInt(item, 10) === timestamp;
            });
            if (index < 0) {
                index = keysLength - 1;
            }

            let found;

            let count = 1;
            let done = false;
            while (found === undefined && !done && count < MAX_INTERPOLATE) {
                const previous = index - count;
                const next = index + count;
                if (previous >= 0 && values[previous] !== undefined && values[previous][prop] !== null) {
                    found = values[previous][prop];
                } else if (next < keysLength && values[next] !== undefined && values[next][prop] !== null) {
                    found = values[next][prop];
                }

                if (previous < 0 && next >= keysLength) {
                    done = true;
                }

                count++;
            }

            return found === undefined ? null : found;
        },
        adjustInterpolatedValues(timestamp, prop, trueValue) {
            const keys = Object.keys(this.valuesByTimestamp);
            const keysLength = keys.length;
            const values = Object.values(this.valuesByTimestamp);
            let index = keys.findIndex(item => {
                return parseInt(item, 10) === timestamp;
            });
            if (index < 0) {
                index = keysLength;
            }

            let count = 1;
            let prevDone = false;
            let prevInterpolated = false;
            let nextDone = false;
            let nextInterpolated = false;
            while ((!prevDone || !nextDone) && count < MAX_INTERPOLATE) {
                const previous = index - count;
                const next = index + count;
                if (prevDone === false && previous >= 0 && values[previous] !== undefined && values[previous][`${prop}Interpolated`] === true) {
                    this.valuesByTimestamp[keys[previous]][prop] = trueValue;
                    this.valuesByTimestamp[keys[previous]][`${prop}Interpolated`] = false;
                    prevInterpolated = true;
                } else if (prevInterpolated === true && values[previous] !== undefined && values[previous][`${prop}Interpolated`] === false) {
                    //stop when you find the first true value
                    prevDone = true;
                }

                if (nextDone === false && next < keysLength && values[next] !== undefined && values[next][`${prop}Interpolated`] === true) {
                    this.valuesByTimestamp[keys[next]][prop] = trueValue;
                    this.valuesByTimestamp[keys[next]][`${prop}Interpolated`] = false;
                    nextInterpolated = true;
                } else if (nextInterpolated === true && values[next] !== undefined && values[next][`${prop}Interpolated`] === false) {
                    //stop when you find the first true value
                    nextDone = true;
                }

                count++;
            }
        },
        getTimestampForDatum(datum, key, telemetryObject) {
            const timeSystemKey = this.timeContext.timeSystem().key;
            const metadata = this.openmct.telemetry.getMetadata(telemetryObject);
            let metadataValue = metadata.value(timeSystemKey) || { format: timeSystemKey };

            return this.parse(key, metadataValue, datum);
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
