<template>
  <div class="c-inspect-properties">
    <h2>Configuration</h2>
    <section>
      <div class="c-form-row">
        <label for="historical-toggle">Enable Historical: </label>
        <ToggleSwitch
          id="historical-toggle"
          class="c-toggle-switch"
          :checked="historicalEnabled"
          name="condition-historical-toggle"
          @change="onToggleChange"
        />
      </div>
    </section>
  </div>
</template>

<script>
import ToggleSwitch from '../../../ui/components/ToggleSwitch.vue';

export default {
  components: {
    ToggleSwitch
  },
  inject: ['openmct', 'domainObject'],
  data() {
    return {
      historicalEnabled: false
    };
  },
  mounted() {
    this.historicalEnabled = this.domainObject.configuration.shouldFetchHistorical;
  },
  methods: {
    onToggleChange() {
      this.historicalEnabled = !this.historicalEnabled;
      this.openmct.objects.mutate(
        this.domainObject,
        'configuration.shouldFetchHistorical',
        this.historicalEnabled
      );
    }
  }
};
</script>

<style scoped>
.c-inspect-properties {
  padding: 10px;
}

.c-form-row {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

label {
  margin-right: 10px;
}
</style>
