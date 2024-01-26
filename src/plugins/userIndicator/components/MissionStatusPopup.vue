<template>
  <div class="control-panel">
    <div class="header">
      <span>CONTROL PANEL</span>
      <button class="close-btn" @click.stop="onDismiss">X</button>
    </div>
    <div v-for="status in missionStatuses" :key="status" class="status-item">
      <label :for="status">{{ status }}</label>
      <button class="status-btn go">GO</button>
      <select :id="status.label">
        <option v-for="option in missionStatusOptions" :key="option.key">
          {{ option.label }}
        </option>
      </select>
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
      missionStatusOptions: []
    };
  },
  async created() {
    this.missionStatuses = await this.openmct.user.status.getPossibleMissionStatuses();
    this.missionStatusOptions = await this.openmct.user.status.getPossibleMissionStatusOptions();
  },
  methods: {
    onDismiss() {
      this.$emit('dismiss');
    }
  }
};
</script>
