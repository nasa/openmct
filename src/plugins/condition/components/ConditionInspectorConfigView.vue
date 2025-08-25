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
