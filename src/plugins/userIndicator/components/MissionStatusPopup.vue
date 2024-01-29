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
export default {
  inject: ['openmct'],
  emits: ['dismiss'],
  data() {
    return {
      missionRoles: [],
      missionRoleStatusOptions: [],
      missionRoleStatusMap: {}
    };
  },
  async created() {
    try {
      // Fetch missionStatuses and missionStatusOptions simultaneously
      const [missionRoles, missionRoleStatusOptions] = await Promise.all([
        this.openmct.user.status.getPossibleMissionRoles(),
        this.openmct.user.status.getPossibleMissionStatusOptions()
      ]);

      this.missionRoles = missionRoles;
      this.missionRoleStatusOptions = missionRoleStatusOptions;

      const statusPromises = missionRoles.map((status) =>
        this.openmct.user.status.getMissionStatusForRole(status)
      );

      // Fetch all mission role statuses simultaneously
      const statuses = await Promise.all(statusPromises);

      // Reduce to a map of mission role to status
      /** @type {Record<string, T>} */
      this.missionRoleStatusMap = missionRoles.reduce((acc, status, index) => {
        acc[status] = statuses[index].key;
        return acc;
      }, {});
    } catch (error) {
      console.error('Error fetching mission statuses:', error);
      this.openmct.notifications.error(`Error fetching mission statuses: ${error.message}`);
    }
  },
  methods: {
    onDismiss() {
      this.$emit('dismiss');
    },
    async onChangeStatus(status) {
      if (!this.openmct.user.status.canSetMissionStatus()) {
        this.openmct.notifications.error('Selected role is ineligible to set mission status');

        return;
      }

      if (this.missionRoleStatusMap !== undefined) {
        const statusObject = this.findOptionByKey(this.missionRoleStatusMap[status]);

        const result = await this.openmct.user.status.setMissionStatusForRole(status, statusObject);
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
