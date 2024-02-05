<template>
  <div class="c-user-control-panel__component">
    <div class="c-user-control-panel__header">
      <div class="c-user-control-panel__title">Mission Status</div>
      <button
        aria-label="Close"
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
            name="setMissionActionStatus"
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
