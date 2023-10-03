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
  <BarGraph
    ref="barGraph"
    class="c-plot c-bar-chart-view"
    :data="trace"
    :plot-axis-title="plotAxisTitle"
    @subscribe="subscribeToAll"
    @unsubscribe="removeAllSubscriptions"
  />
</template>

<script>
import _ from 'lodash';

import BarGraph from './BarGraphPlot.vue';

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
    this.refreshData = this.refreshData.bind(this);
    this.setTimeContext();

    this.loadComposition();
    this.unobserveAxes = this.openmct.objects.observe(
      this.domainObject,
      'configuration.axes',
      this.refreshData
    );
    this.unobserveInterpolation = this.openmct.objects.observe(
      this.domainObject,
      'configuration.useInterpolation',
      this.refreshData
    );
    this.unobserveBar = this.openmct.objects.observe(
      this.domainObject,
      'configuration.useBar',
      this.refreshData
    );
  },
  beforeUnmount() {
    this.stopFollowingTimeContext();

    this.removeAllSubscriptions();

    if (!this.composition) {
      return;
    }

    this.composition.off('add', this.addToComposition);
    this.composition.off('remove', this.removeTelemetryObject);
    if (this.unobserveAxes) {
      this.unobserveAxes();
    }

    if (this.unobserveInterpolation) {
      this.unobserveInterpolation();
    }

    if (this.unobserveBar) {
      this.unobserveBar();
    }
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
    addToComposition(telemetryObject) {
      if (Object.values(this.telemetryObjects).length > 0) {
        this.confirmRemoval(telemetryObject);
      } else {
        this.addTelemetryObject(telemetryObject);
      }
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
    removeFromComposition(telemetryObject) {
      this.composition.remove(telemetryObject);
    },
    addTelemetryObject(telemetryObject) {
      // grab information we need from the added telemetry object
      const key = this.openmct.objects.makeKeyString(telemetryObject.identifier);
      this.telemetryObjects[key] = telemetryObject;
      const metadata = this.openmct.telemetry.getMetadata(telemetryObject);
      this.telemetryObjectFormats[key] = this.openmct.telemetry.getFormatMap(metadata);
      const telemetryObjectPath = [telemetryObject, ...this.path];
      const telemetryIsAlias = this.openmct.objects.isObjectPathToALink(
        telemetryObject,
        telemetryObjectPath
      );

      // make an update object that's a clone of the existing styles object so we preserve existing choices
      let stylesUpdate = {};
      if (this.domainObject.configuration.barStyles.series[key]) {
        stylesUpdate = _.clone(this.domainObject.configuration.barStyles.series[key]);
      }

      stylesUpdate.name = telemetryObject.name;
      stylesUpdate.type = telemetryObject.type;
      stylesUpdate.isAlias = telemetryIsAlias;

      // if something has changed, mutate and notify listeners
      if (!_.isEqual(stylesUpdate, this.domainObject.configuration.barStyles.series[key])) {
        this.openmct.objects.mutate(
          this.domainObject,
          `configuration.barStyles.series["${key}"]`,
          stylesUpdate
        );
      }

      // ask for the current telemetry data, then subscribe for changes
      this.requestDataFor(telemetryObject);
      this.subscribeToObject(telemetryObject);
    },
    setTrace(key, name, axisMetadata, xValues, yValues) {
      let trace = {
        key,
        name: name,
        x: xValues,
        y: yValues,
        xAxisMetadata: {},
        yAxisMetadata: axisMetadata.yAxisMetadata,
        type: this.domainObject.configuration.useBar ? 'bar' : 'scatter',
        mode: 'lines',
        line: {
          shape: this.domainObject.configuration.useInterpolation
        },
        marker: {
          color: this.domainObject.configuration.barStyles.series[key].color
        },
        hoverinfo: this.domainObject.configuration.useBar ? 'skip' : 'x+y'
      };
      this.addTrace(trace, key);
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
      if (!metadata) {
        return {};
      }

      const yAxisMetadata = metadata.valuesForHints(['range'])[0];
      //Exclude 'name' and 'time' based metadata specifically, from the x-Axis values by using range hints only
      const xAxisMetadata = metadata.valuesForHints(['range']).map((metaDatum) => {
        metaDatum.isArrayValue = metadata.isArrayValue(metaDatum);

        return metaDatum;
      });

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

      this.composition.on('add', this.addToComposition);
      this.composition.on('remove', this.removeTelemetryObject);
      this.composition.load();
    },
    refreshData(bounds, isTick) {
      if (!isTick) {
        const telemetryObjects = Object.values(this.telemetryObjects);
        telemetryObjects.forEach((telemetryObject) => {
          //clear existing data
          const key = this.openmct.objects.makeKeyString(telemetryObject.identifier);
          const axisMetadata = this.getAxisMetadata(telemetryObject);
          this.setTrace(key, telemetryObject.name, axisMetadata, [], []);
          //request new data
          this.requestDataFor(telemetryObject);
          this.subscribeToObject(telemetryObject);
        });
      }
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
    },
    removeTelemetryObject(identifier) {
      const key = this.openmct.objects.makeKeyString(identifier);
      if (this.telemetryObjects[key]) {
        delete this.telemetryObjects[key];
      }

      if (this.telemetryObjectFormats && this.telemetryObjectFormats[key]) {
        delete this.telemetryObjectFormats[key];
      }

      if (this.domainObject.configuration.barStyles.series[key]) {
        delete this.domainObject.configuration.barStyles.series[key];
        this.openmct.objects.mutate(
          this.domainObject,
          `configuration.barStyles.series["${key}"]`,
          undefined
        );
      }

      this.removeSubscription(key);

      this.trace = this.trace.filter((t) => t.key !== key);
    },
    addDataToGraph(telemetryObject, data, axisMetadata) {
      const key = this.openmct.objects.makeKeyString(telemetryObject.identifier);

      if (data.message) {
        this.openmct.notifications.alert(data.message);
      }

      if (!this.isDataInTimeRange(data, key, telemetryObject)) {
        return;
      }

      if (
        this.domainObject.configuration.axes.xKey === undefined ||
        this.domainObject.configuration.axes.yKey === undefined
      ) {
        return;
      }

      let xValues = [];
      let yValues = [];
      let xAxisMetadata = axisMetadata.xAxisMetadata.find(
        (metadata) => metadata.key === this.domainObject.configuration.axes.xKey
      );
      if (xAxisMetadata && xAxisMetadata.isArrayValue) {
        //populate x and y values
        let metadataKey = this.domainObject.configuration.axes.xKey;
        if (data[metadataKey] !== undefined) {
          xValues = this.parse(key, metadataKey, data);
        }

        metadataKey = this.domainObject.configuration.axes.yKey;
        if (data[metadataKey] !== undefined) {
          yValues = this.parse(key, metadataKey, data);
        }
      } else {
        //populate X and Y values for plotly
        axisMetadata.xAxisMetadata
          .filter((metadataObj) => !metadataObj.isArrayValue)
          .forEach((metadata) => {
            if (!xAxisMetadata) {
              //Assign the first metadata to use for any formatting
              xAxisMetadata = metadata;
            }

            xValues.push(metadata.name);
            if (data[metadata.key]) {
              const parsedValue = this.parse(key, metadata.key, data);
              yValues.push(parsedValue);
            } else {
              yValues.push(null);
            }
          });
      }

      this.setTrace(key, telemetryObject.name, axisMetadata, xValues, yValues);
    },
    isDataInTimeRange(datum, key, telemetryObject) {
      const timeSystemKey = this.timeContext.timeSystem().key;
      const metadata = this.openmct.telemetry.getMetadata(telemetryObject);
      let metadataValue = metadata.value(timeSystemKey) || { key: timeSystemKey };

      let currentTimestamp = this.parse(key, metadataValue.key, datum);

      return currentTimestamp && this.timeContext.bounds().end >= currentTimestamp;
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
      const options = this.getOptions();
      this.openmct.telemetry
        .request(telemetryObject, options)
        .then((data) => {
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
      const unsubscribe = this.openmct.telemetry.subscribe(
        telemetryObject,
        (data) => this.addDataToGraph(telemetryObject, data, axisMetadata),
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
    }
  }
};
</script>
