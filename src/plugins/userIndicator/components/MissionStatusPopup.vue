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
      <template v-for="status in missionStatuses" :key="status">
        <label class="c-ucp-mission-status__label" :for="status">{{ status }}</label>
        <div class="c-ucp-mission-status__widget" :class="missionStatusClass(status)">
          {{ selectedStatus[status] }}
        </div>
        <div class="c-ucp-mission-status__select">
          <select :id="status" v-model="selectedStatus[status]">
            <option
              v-for="option in missionStatusOptions"
              :key="option.key"
              @change="onChangeStatus"
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
      missionStatuses: [],
      missionStatusOptions: [],
      selectedStatus: {}
    };
  },
  computed: {
    missionStatusClass() {
      return (status) => {
        return {
          '--is-no-go': this.selectedStatus[status] === 'NO GO'
        };
      };
    }
  },
  async created() {
    this.missionStatuses = await this.openmct.user.status.getPossibleMissionStatuses();
    this.missionStatusOptions = await this.openmct.user.status.getPossibleMissionStatusOptions();
    this.selectedStatus = await Promise.all(
      this.missionStatuses.map(
        this.openmct.user.status.getMissionStatusForRole.bind(this.openmct.user.status)
      )
    );
  },
  methods: {
    onDismiss() {
      this.$emit('dismiss');
    },
    async onChangeStatus(event) {
      if (!this.openmct.user.status.canSetMissionStatus()) {
        this.openmct.notifications.error('Selected role is ineligible to set mission status');

        return;
      }

      if (this.selectedStatus !== undefined) {
        const statusObject = this.findStatusByKey(this.selectedStatus);

        const result = await this.openmct.user.status.setMissionStatusForRole(statusObject);
        if (result === true) {
          this.openmct.notifications.info('Successfully set operator status');
        } else {
          this.openmct.notifications.error('Unable to set operator status');
        }
      }
    }
  }
};
</script>
