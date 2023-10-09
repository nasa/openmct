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
  <div class="c-inspector__numeric-data">
    <div class="c-inspect-properties">
      <div class="c-inspect-properties__header">Numeric Data</div>
    </div>
    <div ref="numericDataView"></div>

    <div v-if="!hasNumericData">
      {{ noNumericDataText }}
    </div>
  </div>
</template>
<script>
import mount from 'utils/mount';

import Plot from '../plot/PlotView.vue';
import TelemetryFrame from './TelemetryFrame.vue';

export default {
  inject: ['openmct', 'domainObject', 'timeFormatter'],
  props: {
    bounds: {
      type: Object,
      required: true
    },
    telemetryKeys: {
      type: Array,
      default: () => []
    },
    noNumericDataText: {
      type: String,
      default: 'No Numeric Data to display.'
    }
  },
  data() {
    return {
      plotObjects: []
    };
  },
  computed: {
    hasNumericData() {
      return this.plotObjects.length > 0;
    }
  },
  watch: {
    telemetryKeys: {
      handler() {
        this.renderNumericData();
      },
      deep: true
    },
    bounds: {
      handler() {
        this.renderNumericData();
      },
      deep: true
    }
  },
  mounted() {
    this.renderNumericData();
  },
  beforeUnmount() {
    this.clearPlots();
  },
  methods: {
    renderNumericData() {
      this.clearPlots();

      this.unregisterTimeContextList = [];
      this.elementsList = [];
      this.componentsList = [];

      this.telemetryKeys.forEach(async (telemetryKey) => {
        const plotObject = await this.openmct.objects.get(telemetryKey);

        this.plotObjects.push(plotObject);
        this.unregisterTimeContextList.push(this.setIndependentTimeContextForComponent(plotObject));
        this.renderPlot(plotObject);
      });
    },
    setIndependentTimeContextForComponent(plotObject) {
      const keyString = this.openmct.objects.makeKeyString(plotObject.identifier);

      // get an independent time context for object
      this.openmct.time.getContextForView([plotObject]);
      // set the time context of the object to the selected time range
      return this.openmct.time.addIndependentContext(keyString, this.bounds);
    },
    renderPlot(plotObject) {
      const { vNode, destroy } = mount(
        {
          components: {
            TelemetryFrame,
            Plot
          },
          provide: {
            openmct: this.openmct,
            path: [plotObject]
          },
          data() {
            return {
              plotObject,
              bounds: this.bounds
            };
          },
          template: `<TelemetryFrame
                      :bounds="bounds"
                      :telemetry-object="plotObject"
                    >
                      <Plot />
                    </TelemetryFrame>`
        },
        {
          app: this.openmct.app
        }
      );

      this.componentsList.push(destroy);
      this.elementsList.push(vNode.el);
      this.$refs.numericDataView.append(vNode.el);
    },
    clearPlots() {
      if (this.componentsList?.length) {
        this.componentsList.forEach((destroy) => destroy());
        delete this.componentsList;
      }

      if (this.elementsList?.length) {
        this.elementsList.forEach((element) => element.remove());
        delete this.elementsList;
      }

      if (this.plotObjects?.length) {
        this.plotObjects = [];
      }

      if (this.unregisterTimeContextList?.length) {
        this.unregisterTimeContextList.forEach((unregisterTimeContext) => unregisterTimeContext());
        delete this.unregisterTimeContextList;
      }
    }
  }
};
</script>
