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
  <div class="c-inspector__properties c-inspect-properties">
    <div class="u-contents">
      <div class="c-inspect-properties__header">{{ heading }}</div>
      <div class="c-inspect-properties__row">
        <div class="c-inspect-properties__label" title="Set Status">Set Status</div>
        <div class="c-inspect-properties__value" aria-label="Activity Status Label">
          <select
            v-model="currentStatusKey"
            name="setActivityStatus"
            aria-label="Activity Status"
            @change="changeActivityStatus"
          >
            <option
              v-for="status in activityStates"
              :key="status.key"
              :value="status.key"
              :aria-selected="currentStatusKey === status.key"
            >
              {{ status.label }}
            </option>
          </select>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const activityStates = [
  {
    key: 'notStarted',
    label: 'Not started'
  },
  {
    key: 'in-progress',
    label: 'In progress'
  },
  {
    key: 'completed',
    label: 'Completed'
  },
  {
    key: 'aborted',
    label: 'Aborted'
  },
  {
    key: 'cancelled',
    label: 'Cancelled'
  }
];

export default {
  props: {
    activity: {
      type: Object,
      required: true
    },
    executionState: {
      type: String,
      default() {
        return '';
      }
    },
    heading: {
      type: String,
      required: true
    }
  },
  emits: ['updateActivityState'],
  data() {
    return {
      activityStates: activityStates,
      currentStatusKey: activityStates[0].key
    };
  },
  watch: {
    executionState() {
      this.setActivityStatus();
    }
  },
  mounted() {
    this.setActivityStatus();
  },
  methods: {
    setActivityStatus() {
      let statusKeyIndex = activityStates.findIndex((state) => state.key === this.executionState);
      if (statusKeyIndex < 0) {
        statusKeyIndex = 0;
      }
      this.currentStatusKey = this.activityStates[statusKeyIndex].key;
    },
    changeActivityStatus() {
      if (this.currentStatusKey === '') {
        return;
      }
      this.activity.executionState = this.currentStatusKey;
      this.$emit('updateActivityState', {
        key: this.activity.id,
        executionState: this.currentStatusKey
      });
    }
  }
};
</script>
