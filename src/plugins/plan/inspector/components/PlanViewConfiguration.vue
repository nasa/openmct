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
  <div class="c-inspect-properties">
    <div class="c-inspect-properties__header">Swimlane Visibility</div>
    <ul class="c-inspect-properties__section">
      <li
        v-for="(visible, swimlaneName) in configuration.swimlaneVisibility"
        :key="swimlaneName"
        class="c-inspect-properties__row"
      >
        <div class="c-inspect-properties__label" title="Show or hide swimlane">
          <label :for="swimlaneName + 'ColumnControl'">{{ swimlaneName }}</label>
        </div>
        <div class="c-inspect-properties__value">
          <input
            v-if="isEditing"
            :id="swimlaneName + 'ColumnControl'"
            type="checkbox"
            :checked="visible === true"
            @change="toggleHideSwimlane(swimlaneName)"
          />
          <div v-else class="value">
            {{ visible === true ? 'Visible' : 'Hidden' }}
          </div>
        </div>
      </li>
    </ul>
    <div class="c-inspect-properties__header">Display settings</div>
    <ul class="c-inspect-properties__section">
      <li class="c-inspect-properties__row">
        <div class="c-inspect-properties__label" title="Clip Activity Names">
          <label for="clipActivityNames">Clip Activity Names</label>
        </div>
        <div class="c-inspect-properties__value">
          <input
            v-if="isEditing"
            id="clipActivityNames"
            type="checkbox"
            :checked="configuration.clipActivityNames === true"
            @change="toggleClipActivityNames"
          />
          <div v-else class="value">
            {{ configuration.clipActivityNames === true ? 'On' : 'Off' }}
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>
<script>
import PlanViewConfiguration from '../../PlanViewConfiguration';

export default {
  components: {},
  inject: ['openmct'],
  data() {
    const selection = this.openmct.selection.get();
    /** @type {import('../../../api/objects/ObjectAPI').DomainObject}  */
    const domainObject = selection[0][0].context.item;
    const planViewConfiguration = new PlanViewConfiguration(domainObject, this.openmct);

    return {
      planViewConfiguration,
      isEditing: this.openmct.editor.isEditing(),
      configuration: planViewConfiguration.getConfiguration()
    };
  },
  computed: {
    canEdit() {
      return this.isEditing;
    }
  },
  mounted() {
    this.openmct.editor.on('isEditing', this.setIsEditing);
    this.planViewConfiguration.on('change', this.handleConfigurationChange);
  },
  beforeDestroy() {
    this.openmct.editor.off('isEditing', this.setIsEditing);
    this.planViewConfiguration.off('change', this.handleConfigurationChange);
  },
  methods: {
    /**
     * @param {Object.<string, any>} newConfiguration
     */
    handleConfigurationChange(newConfiguration) {
      this.configuration = newConfiguration;
    },
    /**
     * @param {boolean} isEditing
     */
    setIsEditing(isEditing) {
      this.isEditing = isEditing;
    },
    toggleClipActivityNames() {
      this.planViewConfiguration.setClipActivityNames(!this.configuration.clipActivityNames);
    },
    /**
     * @param {string} swimlaneName
     */
    toggleHideSwimlane(swimlaneName) {
      this.planViewConfiguration.setSwimlaneVisibility(
        swimlaneName,
        !this.configuration.swimlaneVisibility[swimlaneName]
      );
    }
  }
};
</script>
