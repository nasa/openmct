<!--
 Open MCT, Copyright (c) 2014-2023, United States Government
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
    @subscribe="subscribeToAll"
    @unsubscribe="removeAllSubscriptions"
  />
</template>

<script>
import _ from 'lodash';

import ScatterPlotWithUnderlay from './ScatterPlotWithUnderlay.vue';

export default {
  components: {
    ScatterPlotWithUnderlay
  },
  inject: ['openmct', 'domainObject', 'path'],
  data() {
    this.telemetryObjects = {};
    this.telemetryObjectFormats = {};
    this.valuesByTimestamp = {};
    this.subscriptions = [];

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
    this.reloadTelemetry = _.debounce(this.reloadTelemetry, 500);
    this.unobserve = this.openmct.objects.observe(
      this.domainObject,
      'configuration.axes',
      this.reloadTelemetry
    );
    this.unobserveUnderlayRanges = this.openmct.objects.observe(
      this.domainObject,
      'configuration.ranges',
      this.reloadTelemetry
    );
  },
  beforeUnmount() {
    this.stopFollowingTimeContext();

    if (!this.composition) {
      return;
    }

    this.removeAllSubscriptions();

    this.composition.off('add', this.addToComposition);
    this.composition.off('remove', this.removeTelemetryObject);
    if (this.unobserve) {
      this.unobserve();
    }

    if (this.unobserveUnderlayRanges) {
      this.unobserveUnderlayRanges();
    }
  },
  methods: {
    setTimeContext() {
      this.stopFollowingTimeContext();

      this.timeContext = this.openmct.time.getContextForView(this.path);
      this.followTimeContext();
    },
    followTimeContext() {
      this.timeContext.on('bounds', this.reloadTelemetryOnBoundsChange);
    },
    stopFollowingTimeContext() {
      if (this.timeContext) {
        this.timeContext.off('bounds', this.reloadTelemetryOnBoundsChange);
      }
    },
    addToComposition(telemetryObject) {
      if (Object.values(this.telemetryObjects).length > 0) {
        this.confirmRemoval(telemetryObject);
      } else {
        this.addTelemetryObject(telemetryObject);
      }
    },
    removeFromComposition(telemetryObject) {
      this.composition.remove(telemetryObject);
    },
    addTelemetryObject(telemetryObject) {
      // grab information we need from the added telemetry object
      const key = this.openmct.objects.makeKeyString(telemetryObject.identifier);
      this.telemetryObjects[key] = telemetryObject;
      const metadata = this.openmct.telemetry.getMetadata(telemetryObject);
      this.telemetryObjectFormats[key] = this.openmct.telemetry.getFormatMap(metadata);
      this.getDataForTelemetry(key);
    },
    confirmRemoval(telemetryObject) {
      const dialog = this.openmct.overlays.dialog({
        iconClass: 'alert',
        message: 'This action will replace the current telemetry source. Do you want to continue?',
        buttons: [
          {
            label: 'Ok',
            emphasis: true,
            callback: () => {
              const oldTelemetryObject = Object.values(this.telemetryObjects)[0];
              this.removeFromComposition(oldTelemetryObject);
              this.removeTelemetryObject(oldTelemetryObject.identifier);
              this.valuesByTimestamp = {};
              this.addTelemetryObject(telemetryObject);
              dialog.dismiss();
            }
          },
          {
            label: 'Cancel',
            callback: () => {
              this.removeFromComposition(telemetryObject);
              dialog.dismiss();
            }
          }
        ]
      });
    },
    getTelemetryProcessor(keyString) {
      return (telemetry) => {
        //Check that telemetry object has not been removed since telemetry was requested.
        const telemetryObject = this.telemetryObjects[keyString];
        if (!telemetryObject) {
          return;
        }

        telemetry.forEach((datum) => {
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
      this.composition.on('add', this.addToComposition);
      this.composition.on('remove', this.removeTelemetryObject);
      this.composition.load();
    },
    reloadTelemetryOnBoundsChange(bounds, isTick) {
      if (!isTick) {
        this.reloadTelemetry();
      }
    },
    reloadTelemetry() {
      this.valuesByTimestamp = {};

      Object.keys(this.telemetryObjects).forEach((key) => {
        this.getDataForTelemetry(key);
      });
    },
    getDataForTelemetry(key) {
      const telemetryObject = this.telemetryObjects[key];
      if (!telemetryObject) {
        return;
      }

      const telemetryProcessor = this.getTelemetryProcessor(key);
      const options = this.getOptions();
      this.openmct.telemetry.request(telemetryObject, options).then(telemetryProcessor);
      this.subscribeToObject(telemetryObject);
    },
    removeTelemetryObject(identifier) {
      const key = this.openmct.objects.makeKeyString(identifier);
      if (this.telemetryObjects[key]) {
        delete this.telemetryObjects[key];
      }

      if (this.telemetryObjectFormats && this.telemetryObjectFormats[key]) {
        delete this.telemetryObjectFormats[key];
      }

      this.removeSubscription(key);
    },
    addDataToGraph(telemetryObject, data) {
      const key = this.openmct.objects.makeKeyString(telemetryObject.identifier);

      if (data.message) {
        this.openmct.notifications.alert(data.message);
      }

      if (
        !this.domainObject.configuration.axes.xKey ||
        !this.domainObject.configuration.axes.yKey
      ) {
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
      const xValues = xAndyValues.map((value) => value.x);
      const yValues = xAndyValues.map((value) => value.y);
      const axisMetadata = this.getAxisMetadata(telemetryObject);
      const xAxisMetadata = axisMetadata.find(
        (metadata) => metadata.source === this.domainObject.configuration.axes.xKey
      );
      let yAxisMetadata = {};
      if (this.domainObject.configuration.axes.yKey) {
        yAxisMetadata = axisMetadata.find(
          (metadata) => metadata.source === this.domainObject.configuration.axes.yKey
        );
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

      if (
        this.domainObject.configuration.ranges !== undefined &&
        this.domainObject.configuration.ranges.domainMin !== undefined &&
        this.domainObject.configuration.ranges.domainMax !== undefined
      ) {
        trace.xaxis = {
          min: this.domainObject.configuration.ranges.domainMin,
          max: this.domainObject.configuration.ranges.domainMax
        };
      }

      if (
        this.domainObject.configuration.ranges !== undefined &&
        this.domainObject.configuration.ranges.rangeMin !== undefined &&
        this.domainObject.configuration.ranges.rangeMax !== undefined
      ) {
        trace.yaxis = {
          min: this.domainObject.configuration.ranges.rangeMin,
          max: this.domainObject.configuration.ranges.rangeMax
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
    },
    getOptions() {
      const { start, end } = this.timeContext.bounds();

      return {
        end,
        start
      };
    },
    subscribeToObject(telemetryObject) {
      const key = this.openmct.objects.makeKeyString(telemetryObject.identifier);

      this.removeSubscription(key);

      const options = this.getOptions();
      const unsubscribe = this.openmct.telemetry.subscribe(
        telemetryObject,
        (data) => this.addDataToGraph(telemetryObject, data),
        options
      );

      this.subscriptions.push({
        key,
        unsubscribe
      });
    },
    subscribeToAll() {
      const telemetryObjects = Object.values(this.telemetryObjects);
      telemetryObjects.forEach(this.subscribeToObject);
    },
    removeAllSubscriptions() {
      this.subscriptions.forEach((subscription) => subscription.unsubscribe());
      this.subscriptions = [];
    },
    removeSubscription(key) {
      const found = this.subscriptions.findIndex((subscription) => subscription.key === key);
      if (found > -1) {
        this.subscriptions[found].unsubscribe();
        this.subscriptions.splice(found, 1);
      }
    }
  }
};
</script>
