<!--
 Open MCT, Copyright (c) 2014-2024, United States Government
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
  <div class="c-inspector__properties c-inspect-properties">
    <div class="u-contents">
      <div class="c-inspect-properties__header">Plan Execution Status</div>
      <div v-if="hasExecutionMonitoringProvider" class="c-inspect-properties__row">
        <div class="c-inspect-properties__label" aria-label="Plan Execution Monitoring Status">
          {{ currentStatusLabel }}
        </div>
        <div
          v-if="planExecutionMonitoringStatus !== executionMonitorStates[0].key"
          class="c-inspect-properties__value"
          aria-label="Plan Execution Monitoring Duration"
        >
          {{ duration }} <span class="hint">minutes</span>
        </div>
      </div>
      <div v-else class="c-inspect-properties__row">
        <div
          class="c-inspect-properties__label"
          aria-label="Plan Execution Monitoring Status Label"
        >
          <select
            v-model="planExecutionMonitoringStatus"
            name="executionMonitoringStatus"
            aria-label="Plan Execution Monitoring Status"
            @change="changePlanExecutionMonitoring"
          >
            <option
              v-for="status in executionMonitorStates"
              :key="status.key"
              :value="status.key"
              :aria-selected="planExecutionMonitoringStatus === status.key"
            >
              {{ status.label }}
            </option>
          </select>
        </div>
        <div
          v-if="planExecutionMonitoringStatus !== executionMonitorStates[0].key"
          class="c-inspect-properties__value"
        >
          <input
            id="plan_execution_monitoring_duration"
            v-model="duration"
            aria-label="Plan Execution Monitoring Duration"
            class="c-input--sm"
            type="number"
            @change="toggleDuration"
          />
          <span class="hint">minutes</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { PLAN_EXECUTION_MONITORING_KEY } from '../../../planExecutionMonitoring/planExecutionMonitoringIdentifier.js';

const executionMonitorStates = [
  {
    key: 'nominal',
    label: 'Nominal'
  },
  {
    key: 'behind',
    label: 'Behind by'
  },
  {
    key: 'ahead',
    label: 'Ahead by'
  }
];

export default {
  inject: ['openmct'],
  props: {
    planObject: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      executionMonitorStates: executionMonitorStates,
      planExecutionMonitoringStatus: executionMonitorStates[0].key,
      duration: 0,
      hasExecutionMonitoringProvider: false
    };
  },
  computed: {
    currentStatusLabel() {
      const state = executionMonitorStates.find(
        (status) => status.key === this.planExecutionMonitoringStatus
      );
      return state ? state.label : executionMonitorStates[0].label;
    }
  },
  watch: {
    planObject() {
      this.getStatus();
    }
  },
  mounted() {
    this.getStatus();
  },
  beforeUnmount() {
    if (this.stopObservingPlanExecutionMonitoringStatusObject) {
      this.stopObservingPlanExecutionMonitoringStatusObject();
    }
  },
  methods: {
    getStatus() {
      this.planIdentifier = this.openmct.objects.makeKeyString(this.planObject.identifier);
      this.getPlanExecutionMonitoringStatus();
    },
    toggleDuration() {
      if (this.hasExecutionMonitoringProvider) {
        return;
      }
      if (this.duration === undefined || this.duration < 0) {
        return;
      }
      if (this.duration === 0) {
        this.planExecutionMonitoringStatus = executionMonitorStates[0].key;
      }
      this.persistExecutionMonitoringStatus();
    },
    changePlanExecutionMonitoring() {
      if (this.hasExecutionMonitoringProvider) {
        return;
      }
      if (this.planExecutionMonitoringStatus === '') {
        return;
      }
      this.persistExecutionMonitoringStatus();
    },
    setPlanExecutionMonitoring(status, duration) {
      let statusKeyIndex = executionMonitorStates.findIndex((state) => state.key === status);
      if (statusKeyIndex < 0) {
        statusKeyIndex = 0;
      }
      this.planExecutionMonitoringStatus = this.executionMonitorStates[statusKeyIndex].key;
      this.duration = duration ?? 0;
    },
    async getPlanExecutionMonitoringStatus() {
      this.stopObservingPlanExecutionMonitoringStatusObject?.();

      const executionMonitoringProvider = this.openmct.telemetry.getExecutionMonitoring(
        this.planObject
      );

      if (executionMonitoringProvider) {
        this.hasExecutionMonitoringProvider = true;
        const status = await executionMonitoringProvider.status();
        this.applyExecutionMonitoringStatus(status);
        this.stopObservingPlanExecutionMonitoringStatusObject =
          this.openmct.telemetry.subscribeToExecutionMonitoring(
            this.planObject,
            this.applyExecutionMonitoringStatus.bind(this)
          );
        return;
      }

      this.hasExecutionMonitoringProvider = false;
      this.planExecutionMonitoringStatusObject = await this.openmct.objects.get(
        PLAN_EXECUTION_MONITORING_KEY
      );
      this.setPlanExecutionMonitoringStatus(this.planExecutionMonitoringStatusObject);
      this.stopObservingPlanExecutionMonitoringStatusObject = this.openmct.objects.observe(
        this.planExecutionMonitoringStatusObject,
        '*',
        this.setPlanExecutionMonitoringStatus
      );
    },
    applyExecutionMonitoringStatus(status) {
      if (!status) {
        this.setPlanExecutionMonitoring();
        return;
      }
      this.setPlanExecutionMonitoring(status.status, status.duration);
    },
    setPlanExecutionMonitoringStatus(newStatusObject) {
      const statusObj = newStatusObject?.execution_monitoring?.[this.planIdentifier];
      if (!statusObj) {
        this.setPlanExecutionMonitoring();
        return;
      }
      const { status, duration } = statusObj;
      this.setPlanExecutionMonitoring(status, duration);
    },
    persistExecutionMonitoringStatus() {
      const executionMonitoringStatus = {
        duration: this.duration,
        status: this.planExecutionMonitoringStatus
      };
      const executionMonitoringPath = `execution_monitoring.${this.planIdentifier}`;
      this.openmct.objects.mutate(
        this.planExecutionMonitoringStatusObject,
        executionMonitoringPath,
        executionMonitoringStatus
      );
    }
  }
};
</script>
