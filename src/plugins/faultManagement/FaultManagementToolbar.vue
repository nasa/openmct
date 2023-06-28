<!--
 Open MCT, Copyright (c) 2014-2023, United States Government
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
  <div class="c-fault-mgmt__toolbar">
    <button
      class="c-icon-button icon-check"
      title="Acknowledge selected faults"
      :disabled="disableAcknowledge"
      @click="acknowledgeSelected"
    >
      <div title="Acknowledge selected faults" class="c-icon-button__label">Acknowledge</div>
    </button>

    <button
      class="c-icon-button icon-timer"
      title="Shelve selected faults"
      :disabled="disableShelve"
      @click="shelveSelected"
    >
      <div title="Shelve selected items" class="c-icon-button__label">Shelve</div>
    </button>
  </div>
</template>

<script>
export default {
  inject: ['openmct', 'domainObject'],
  props: {
    selectedFaults: {
      type: Object,
      default() {
        return {};
      }
    }
  },
  data() {
    return {
      disableAcknowledge: true,
      disableShelve: true
    };
  },
  watch: {
    selectedFaults(newSelectedFaults) {
      const selectedfaults = Object.values(newSelectedFaults);

      let disableAcknowledge = true;
      let disableShelve = true;

      selectedfaults.forEach((fault) => {
        if (!fault.shelved) {
          disableShelve = false;
        }

        if (!fault.acknowledged) {
          disableAcknowledge = false;
        }
      });

      this.disableAcknowledge = disableAcknowledge;
      this.disableShelve = disableShelve;
    }
  },
  methods: {
    acknowledgeSelected() {
      this.$emit('acknowledgeSelected');
    },
    shelveSelected() {
      this.$emit('shelveSelected');
    }
  }
};
</script>
