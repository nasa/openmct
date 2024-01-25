<template>
  <div class="control-panel">
    <div class="header">
      <span>CONTROL PANEL</span>
      <button class="close-btn">X</button>
    </div>
    <div v-for="status in missionStatuses" :key="status" class="status-item">
      <label :for="status">{{ status }}</label>
      <button class="status-btn go">GO</button>
      <select :id="status.label">
        <option v-for="option in missionStatusOptions" :key="option.key">
          {{ option.label }}
        </option>
      </select>
      <!-- <div class="status-item">
      <label for="commandingStatus">Commanding Status</label>
      <button class="status-btn go">GO</button>
      <select id="commandingStatus">
        <option>- Set Status -</option>
        <option value="status1">Status 1</option>
        <option value="status2">Status 2</option>
      </select>
    </div>
    <div class="status-item">
      <label for="driveStatus">Drive Status</label>
      <button class="status-btn go">GO</button>
      <select id="driveStatus">
        <option>- Set Status -</option>
        <option value="status1">Status 1</option>
        <option value="status2">Status 2</option>
      </select>
    </div> -->
    </div>
  </div>
</template>

<script>
export default {
  inject: ['openmct'],
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
  methods: {}
};
</script>
