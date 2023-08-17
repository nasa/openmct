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
  <div v-if="isShowDetails" class="c-inspector__properties c-inspect-properties">
    <div class="c-inspect-properties__header">Fault Details</div>
    <ul class="c-inspect-properties__section">
      <DetailText :detail="sourceDetails" />
      <DetailText :detail="occurredDetails" />
      <DetailText :detail="criticalityDetails" />
      <DetailText :detail="descriptionDetails" />
    </ul>

    <div class="c-inspect-properties__header">Telemetry</div>
    <ul class="c-inspect-properties__section">
      <DetailText :detail="systemDetails" />
      <DetailText :detail="tripValueDetails" />
      <DetailText :detail="currentValueDetails" />
    </ul>
  </div>
</template>

<script>
import DetailText from '../inspectorViews/properties/DetailText.vue';

export default {
  name: 'FaultManagementInspector',
  components: {
    DetailText
  },
  inject: ['openmct'],
  data() {
    return {
      isShowDetails: false
    };
  },
  computed: {
    criticalityDetails() {
      return {
        name: 'Criticality',
        value: this.selectedFault?.severity
      };
    },
    currentValueDetails() {
      return {
        name: 'Live value',
        value: this.selectedFault?.currentValueInfo?.value
      };
    },
    descriptionDetails() {
      return {
        name: 'Description',
        value: this.selectedFault?.shortDescription
      };
    },
    occurredDetails() {
      return {
        name: 'Occurred',
        value: this.selectedFault?.triggerTime
      };
    },
    sourceDetails() {
      return {
        name: 'Source',
        value: this.selectedFault?.name
      };
    },
    systemDetails() {
      return {
        name: 'System',
        value: this.selectedFault?.namespace
      };
    },
    tripValueDetails() {
      return {
        name: 'Trip Value',
        value: this.selectedFault?.triggerValueInfo?.value
      };
    }
  },
  mounted() {
    this.updateSelectedFaults();
  },
  methods: {
    updateSelectedFaults() {
      const selection = this.openmct.selection.get();
      this.isShowDetails = false;

      if (selection.length === 0 || selection[0].length < 2) {
        return;
      }

      const selectedFaults = selection[0][1].context.selectedFaults;
      if (selectedFaults.length !== 1) {
        return;
      }

      this.isShowDetails = true;
      this.selectedFault = selectedFaults[0];
    }
  }
};
</script>
