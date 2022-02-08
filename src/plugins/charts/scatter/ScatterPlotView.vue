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
          @subscribe="subscribeToAll"
          @unsubscribe="removeAllSubscriptions"
/>
</template>

<script>
import BarGraph from '../BarGraphPlot.vue';
import _ from 'lodash';

const MAX_INTERPOLATE = 5;

export default {
    components: {
        BarGraph
    },
    inject: ['openmct', 'domainObject', 'path'],
    data() {
        this.telemetryObjects = {};
        this.telemetryObjectFormats = {};
        this.subscriptions = [];
        this.composition = {};

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
        this.telemetryCollections = {};
        this.valuesByTimestamp = {};
        this.refreshData = this.refreshData.bind(this);
        this.setTimeContext();

        this.loadComposition();

    },
    beforeDestroy() {
        this.stopFollowingTimeContext();

        this.removeAllSubscriptions();

        Object.keys(this.telemetryCollections).forEach(this.removeTelemetryCollection);

        if (!this.composition) {
            return;
        }

        this.composition.off('add', this.addTelemetryObject);
        this.composition.off('remove', this.removeTelemetryObject);
    },
    methods: {
        setTimeContext() {
            this.stopFollowingTimeContext();

            this.timeContext = this.openmct.time.getContextForView(this.path);
            this.followTimeContext();

        },
        followTimeContext() {
            this.timeContext.on('bounds', this.refreshData);
        },
        stopFollowingTimeContext() {
            if (this.timeContext) {
                this.timeContext.off('bounds', this.refreshData);
            }
        },
        addTelemetryObject(telemetryObject) {
            // grab information we need from the added telmetry object
            const key = this.openmct.objects.makeKeyString(telemetryObject.identifier);
            if (!this.domainObject.configuration.xKey) {
                this.domainObject.configuration.xKey = key;
            } else if (!this.domainObject.configuration.yKey && this.domainObject.configuration.xKey !== key) {
                this.domainObject.configuration.yKey = key;
            }

            this.telemetryObjects[key] = telemetryObject;
            const metadata = this.openmct.telemetry.getMetadata(telemetryObject);
            this.telemetryObjectFormats[key] = this.openmct.telemetry.getFormatMap(metadata);

            // make an update object that's a clone of the existing styles object so we preserve existing choices
            let stylesUpdate = {};
            if (this.domainObject.configuration.styles) {
                stylesUpdate = _.clone(this.domainObject.configuration.styles);
            }

            // if something has changed, mutate and notify listeners
            if (!_.isEqual(stylesUpdate, this.domainObject.configuration.styles)) {
                this.openmct.objects.mutate(
                    this.domainObject,
                    'configuration.styles',
                    stylesUpdate
                );
            }

            // ask for the current telemetry data, then subcribe for changes
            this.telemetryCollections[key] = this.openmct.telemetry
                .requestCollection(telemetryObject);

            const telemetryProcessor = this.getTelemetryProcessor(key);
            // this.telemetryCollections[key].on('remove', telemetryRemover);
            this.telemetryCollections[key].on('add', telemetryProcessor);
            // this.telemetryCollections[key].on('clear', this.clearData);
            this.telemetryCollections[key].load();
        },
        getTelemetryProcessor(keyString) {
            return (telemetry) => {
                //Check that telemetry object has not been removed since telemetry was requested.
                const telemetryObject = this.telemetryObjects[keyString];
                if (!telemetryObject) {
                    return;
                }

                telemetry.forEach(datum => {
                    const axisMetadata = this.getAxisMetadata(telemetryObject);
                    this.addDataToGraph(telemetryObject, datum, axisMetadata);
                });
            };
        },
        getAxisMetadata(telemetryObject) {
            const metadata = this.openmct.telemetry.getMetadata(telemetryObject);
            if (!metadata) {
                return {};
            }

            const yAxisMetadata = metadata.valuesForHints(['range'])[0];
            const xAxisMetadata = metadata.valuesForHints(['range'])[0];

            return {
                xAxisMetadata,
                yAxisMetadata
            };
        },
        getOptions() {
            const { start, end } = this.timeContext.bounds();

            return {
                end,
                start
            };
        },
        loadComposition() {
            this.composition = this.openmct.composition.get(this.domainObject);

            if (!this.composition) {
                this.addTelemetryObject(this.domainObject);

                return;
            }

            this.composition.on('add', this.addTelemetryObject);
            this.composition.on('remove', this.removeTelemetryObject);
            this.composition.load();
        },
        refreshData(bounds, isTick) {
            this.purgeRecordsOutsideRange(bounds);
            if (!isTick) {
                const telemetryKeys = Object.keys(this.telemetryCollections);
                telemetryKeys.forEach(key => this.telemetryCollections[key].load());
            }
        },
        purgeRecordsOutsideRange(bounds) {
            Object.keys(this.valuesByTimestamp).forEach(timestamp => {
                if (!this.isTimeInBounds(timestamp, bounds)) {
                    delete this.valuesByTimestamp[timestamp];
                }
            });
        },
        removeTelemetryCollection(keyString) {
            if (this.telemetryCollections[keyString]) {
                this.telemetryCollections[keyString].destroy();
                this.telemetryCollections[keyString] = undefined;
                delete this.telemetryCollections[keyString];
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
            if (this.telemetryObjectFormats && this.telemetryObjectFormats[key]) {
                delete this.telemetryObjectFormats[key];
            }

            if (this.domainObject.configuration.styles) {
                delete this.domainObject.configuration.styles;
                this.openmct.objects.mutate(
                    this.domainObject,
                    'configuration.styles',
                    undefined
                );
            }

            this.removeSubscription(key);

            this.trace = this.trace.filter(t => t.key !== key);
        },
        addDataToGraph(telemetryObject, data, axisMetadata) {
            const key = this.openmct.objects.makeKeyString(telemetryObject.identifier);

            if (data.message) {
                this.openmct.notifications.alert(data.message);
            }

            if (!this.isDataInTimeRange(data, key)) {
                return;
            }

            if (!this.domainObject.configuration.xKey || !this.domainObject.configuration.yKey) {
                return;
            }

            const timestamp = this.getTimestampForDatum(data, key);
            let valueForTimestamp = this.valuesByTimestamp[timestamp] || {};

            if (this.domainObject.configuration.xKey === key) {
                //populate x values
                const metadataKey = axisMetadata.xAxisMetadata.key;
                if (data[metadataKey]) {
                    valueForTimestamp.x = this.format(key, metadataKey, data);
                    valueForTimestamp.xInterpolated = false;
                    // this.adjustInterpolatedValues(timestamp, 'x', valueForTimestamp.x);
                    if (valueForTimestamp.y === undefined) {
                        //find nearest y
                        // valueForTimestamp.y = this.getInterpolatedValue(timestamp, 'y');
                        valueForTimestamp.y = null;
                        valueForTimestamp.yInterpolated = true;
                    }
                }
            } else if (this.domainObject.configuration.yKey === key) {
                const metadataKey = axisMetadata.yAxisMetadata.key;
                if (data[metadataKey]) {
                    valueForTimestamp.y = this.format(key, metadataKey, data);
                    valueForTimestamp.yInterpolated = false;
                    // this.adjustInterpolatedValues(timestamp, 'y', valueForTimestamp.y);
                    if (valueForTimestamp.x === undefined) {
                        //find nearest x
                        // valueForTimestamp.x = this.getInterpolatedValue(timestamp, 'x');
                        valueForTimestamp.x = null;
                        valueForTimestamp.xInterpolated = true;
                    }
                }
            }

            this.valuesByTimestamp[timestamp] = valueForTimestamp;
            const xAndyValues = Object.values(this.valuesByTimestamp);
            const xValues = xAndyValues.map(value => value.x);
            const yValues = xAndyValues.map(value => value.y);

            let trace = {
                key,
                name: telemetryObject.name,
                x: xValues,
                y: yValues,
                text: yValues.map(String),
                xAxisMetadata: axisMetadata.xAxisMetadata,
                yAxisMetadata: axisMetadata.yAxisMetadata,
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
                if (prevDone === false && previous >= 0 && values[previous][`${prop}Interpolated`] === true) {
                    this.valuesByTimestamp[keys[previous]][prop] = trueValue;
                    this.valuesByTimestamp[keys[previous]][`${prop}Interpolated`] = false;
                    prevInterpolated = true;
                } else if (prevInterpolated === true && values[previous][`${prop}Interpolated`] === false) {
                    //stop when you find the first true value
                    prevDone = true;
                }

                if (nextDone === false && next < keysLength && values[next][`${prop}Interpolated`] === true) {
                    this.valuesByTimestamp[keys[next]][prop] = trueValue;
                    this.valuesByTimestamp[keys[next]][`${prop}Interpolated`] = false;
                    nextInterpolated = true;
                } else if (nextInterpolated === true && values[next][`${prop}Interpolated`] === false) {
                    //stop when you find the first true value
                    nextDone = true;
                }

                count++;
            }
        },
        getTimestampForDatum(datum, key) {
            const timeSystemKey = this.timeContext.timeSystem().key;

            return this.parse(key, timeSystemKey, datum);
        },
        isDataInTimeRange(datum, key) {
            let currentTimestamp = this.getTimestampForDatum(datum, key);

            return currentTimestamp && this.isTimeInBounds(currentTimestamp, this.timeContext.bounds());
        },
        isTimeInBounds(currentTimestamp, bounds) {
            return bounds.start <= currentTimestamp && bounds.end >= currentTimestamp;
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
        },
        requestDataFor(telemetryObject) {
            const axisMetadata = this.getAxisMetadata(telemetryObject);
            this.openmct.telemetry.request(telemetryObject)
                .then(data => {
                    data.forEach((datum) => {
                        this.addDataToGraph(telemetryObject, datum, axisMetadata);
                    });
                })
                .catch((error) => {
                    console.warn(`Error fetching data`, error);
                });
        },
        subscribeToObject(telemetryObject) {
            const key = this.openmct.objects.makeKeyString(telemetryObject.identifier);

            this.removeSubscription(key);

            const options = this.getOptions();
            const axisMetadata = this.getAxisMetadata(telemetryObject);
            const unsubscribe = this.openmct.telemetry.subscribe(telemetryObject,
                data => this.addDataToGraph(telemetryObject, data, axisMetadata)
                , options);

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
