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
  <div class="c-user-control-panel__component">
    <div class="c-user-control-panel__header">
      <div class="c-user-control-panel__title">Mission Status</div>
      <button
        aria-label="Close Mission Status Panel"
        class="c-icon-button c-icon-button--sm t-close-btn icon-x"
        @click.stop="onDismiss"
      ></button>
    </div>
    <div class="c-ucp-mission-status">
      <template v-for="action in missionActions" :key="action">
        <label class="c-ucp-mission-status__label" :for="action">{{ action }}</label>
        <div class="c-ucp-mission-status__widget" :class="getMissionActionStatusClass(action)">
          {{ missionActionStatusOptions[missionActionStatusMap[action]]?.label }}
        </div>
        <div class="c-ucp-mission-status__select">
          <select
            :id="action"
            v-model="missionActionStatusMap[action]"
            :name="`${action} status`"
            @change="onChangeStatus(action)"
          >
            <option
              v-for="option in missionActionStatusOptions"
              :key="option.key"
              :value="option.key"
            >
              {{ option.label }}
            </option>
          </select>
        </div>
      </template>
    </div>
  </div>
</template>

<script>
import { inject, ref } from 'vue';

import { useEventEmitter } from '../../../ui/composables/event';

export default {
  inject: ['openmct'],
  emits: ['dismiss'],
  async setup() {
    const openmct = inject('openmct');
    let missionActions = ref([]);
    let missionActionStatusOptions = ref([]);
    let missionActionStatusMap = ref({});

    try {
      // Listen for missionActionStatusChange events
      useEventEmitter(openmct.user.status, 'missionActionStatusChange', ({ action, status }) => {
        missionActionStatusMap.value[action] = status.key; // Update the reactive property
      });
      // Fetch missionStatuses and missionActionStatuses simultaneously
      const [fetchedMissionActions, fetchedMissionActionStatusOptions] = await Promise.all([
        openmct.user.status.getPossibleMissionActions(),
        openmct.user.status.getPossibleMissionActionStatuses()
      ]);

      // Assign the results to the reactive variables
      missionActions.value = fetchedMissionActions;
      missionActionStatusOptions.value = fetchedMissionActionStatusOptions;

      const statusPromises = missionActions.value.map((action) =>
        openmct.user.status.getStatusForMissionAction(action)
      );

      // Fetch all mission action statuses simultaneously
      const statuses = await Promise.all(statusPromises);

      // Reduce to a map of mission action to status
      missionActionStatusMap.value = missionActions.value.reduce((acc, action, index) => {
        acc[action] = statuses[index].key;
        return acc;
      }, {});
    } catch (error) {
      console.error('Error fetching mission statuses:', error);
    }

    return {
      missionActions,
      missionActionStatusOptions,
      missionActionStatusMap
    };
  },
  methods: {
    onDismiss() {
      this.$emit('dismiss');
    },
    async onChangeStatus(action) {
      if (!this.openmct.user.status.canSetMissionStatus()) {
        this.openmct.notifications.error('Selected user role is ineligible to set mission status');

        return;
      }

      if (this.missionActionStatusMap !== undefined) {
        const statusObject = this.findOptionByKey(this.missionActionStatusMap[action]);

        const result = await this.openmct.user.status.setStatusForMissionAction(
          action,
          statusObject
        );
        if (result === true) {
          this.openmct.notifications.info('Successfully set mission status');
        } else {
          this.openmct.notifications.error('Unable to set mission status');
        }
      }
    },
    /**
     * @param {number} optionKey
     */
    findOptionByKey(optionKey) {
      return this.missionActionStatusOptions.find(
        (possibleMatch) => possibleMatch.key === optionKey
      );
    },
    getMissionActionStatusClass(status) {
      const statusValue =
        this.missionActionStatusOptions[this.missionActionStatusMap[status]]?.label;
      return {
        '--is-no-go': statusValue === 'NO GO',
        '--is-go': statusValue === 'GO'
      };
    }
  }
};
</script>
