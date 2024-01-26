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
        <div class="c-ucp-mission-status__widget --is-no-go">NO GO</div>
        <div class="c-ucp-mission-status__select">
          <select :id="status.label">
            <option v-for="option in missionStatusOptions" :key="option.key">
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
      missionStatusOptions: []
    };
  },
  async created() {
    this.missionStatuses = ['Command', 'Drive', 'Camera'];

    this.missionStatusOptions = [
      {
        key: '0',
        label: 'NO GO'
      },
      {
        key: '1',
        label: 'GO'
      }
    ];
  },
  methods: {
    onDismiss() {
      this.$emit('dismiss');
    }
  }
};
</script>
