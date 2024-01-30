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
      <template v-for="role in missionRoles" :key="role">
        <label class="c-ucp-mission-status__label" :for="role">{{ role }}</label>
        <div class="c-ucp-mission-status__widget" :class="getMissionRoleStatusClass(role)">
          {{ missionRoleStatusOptions[missionRoleStatusMap[role]]?.label }}
        </div>
        <div class="c-ucp-mission-status__select">
          <select
            :id="role"
            v-model="missionRoleStatusMap[role]"
            name="setMissionRoleStatus"
            @change="onChangeStatus(role)"
          >
            <option
              v-for="option in missionRoleStatusOptions"
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
    let missionRoles = ref([]);
    let missionRoleStatusOptions = ref([]);
    let missionRoleStatusMap = ref({});

    try {
      // Listen for missionRoleStatusChange events
      useEventEmitter(openmct.user.status, 'missionRoleStatusChange', ({ role, status }) => {
        missionRoleStatusMap.value[role] = status.key; // Update the reactive property
      });
      // Fetch missionStatuses and missionRoleStatuses simultaneously
      const [fetchedMissionRoles, fetchedMissionRoleStatusOptions] = await Promise.all([
        openmct.user.status.getPossibleMissionRoles(),
        openmct.user.status.getPossibleMissionRoleStatuses()
      ]);

      // Assign the results to the reactive variables
      missionRoles.value = fetchedMissionRoles;
      missionRoleStatusOptions.value = fetchedMissionRoleStatusOptions;

      const statusPromises = missionRoles.value.map((role) =>
        openmct.user.status.getStatusForMissionRole(role)
      );

      // Fetch all mission role statuses simultaneously
      const statuses = await Promise.all(statusPromises);

      // Reduce to a map of mission role to status
      missionRoleStatusMap.value = missionRoles.value.reduce((acc, role, index) => {
        acc[role] = statuses[index].key;
        return acc;
      }, {});
    } catch (error) {
      console.error('Error fetching mission statuses:', error);
    }

    return {
      missionRoles,
      missionRoleStatusOptions,
      missionRoleStatusMap
    };
  },
  methods: {
    onDismiss() {
      this.$emit('dismiss');
    },
    async onChangeStatus(role) {
      if (!this.openmct.user.status.canSetMissionStatus()) {
        this.openmct.notifications.error('Selected user role is ineligible to set mission status');

        return;
      }

      if (this.missionRoleStatusMap !== undefined) {
        const statusObject = this.findOptionByKey(this.missionRoleStatusMap[role]);

        const result = await this.openmct.user.status.setStatusForMissionRole(role, statusObject);
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
      return this.missionRoleStatusOptions.find((possibleMatch) => possibleMatch.key === optionKey);
    },
    getMissionRoleStatusClass(status) {
      const statusValue = this.missionRoleStatusOptions[this.missionRoleStatusMap[status]]?.label;
      return {
        '--is-no-go': statusValue === 'NO GO'
      };
    }
  }
};
</script>
