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
  <div
    class="c-inspector__properties c-data-visualization-inspector__properties c-data-visualization-inspector__flex-column"
  >
    <DataVisualization
      :data-ranges="dataRanges"
      :plot-telemetry-keys="plotTelemetryKeys"
      :description="description"
      :is-loading="isLoading"
    />
  </div>
</template>

<script>
import DataVisualization from './DataVisualization.vue';

export default {
  components: {
    DataVisualization
  },
  inject: ['openmct', 'domainObject'],
  props: {
    context: {
      type: Object,
      required: true
    }
  },
  computed: {
    dataRanges() {
      return this.context.dataRanges;
    },
    plotTelemetryKeys() {
      return this.context.telemetryKeys;
    },
    description() {
      return this.context.description;
    },
    isLoading() {
      return Boolean(this.context.loading);
    }
  }
};
</script>
