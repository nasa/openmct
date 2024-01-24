<template>
  <div class="control-panel">
    <div class="header">
      <span>CONTROL PANEL</span>
      <button class="close-btn">X</button>
    </div>
    <div class="status-item">
      <label for="commandingStatus">Commanding Status</label>
      <button class="status-btn go">GO</button>
      <select id="commandingStatus">
        <option>- Set Status -</option>
        <option value="status1">Status 1</option>
        <option value="status2">Status 2</option>
        <!-- Add more status options here -->
      </select>
    </div>
    <div class="status-item">
      <label for="driveStatus">Drive Status</label>
      <button class="status-btn go">GO</button>
      <select id="driveStatus">
        <option>- Set Status -</option>
        <option value="status1">Status 1</option>
        <option value="status2">Status 2</option>
        <!-- Add more status options here -->
      </select>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ControlPanel',
  data() {
    return {
      // Define your data properties here
    };
  },
  methods: {
    // Define your component methods here
  }
};
</script>
