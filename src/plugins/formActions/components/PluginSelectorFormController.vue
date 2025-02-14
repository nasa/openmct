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
  <span class="form-control">
    <span class="field control">
      <div v-for="plugin in getPlugins()" :key="plugin.name">
        <div class="plugin-selector-row">
          <input
            :id="plugin.controlId"
            type="checkbox"
            :checked="plugin.isChecked"
            :disabled="plugin.isDisabled"
            :data-key="plugin.key"
            :aria-label="plugin.ariaLabel"
            @change="onChange"
          />
          <label :for="plugin.controlId">{{ plugin.name }}</label>
          <div :class="plugin.icon" class="plugin-icon" />
        </div>
        <div class="plugin-description-row">
          <div class="plugin-description">{{ plugin.description }}</div>
        </div>
      </div>
    </span>
  </span>
</template>

<script>
import { v4 as uuid } from 'uuid';

export default {
  inject: ['openmct'],
  props: {
    model: {
      type: Object,
      required: true
    }
  },
  emits: ['on-change'],
  data() {
    return {
      changes: {},
      deactivatedPluginTypes: null,
      loadedPluginTypes: null,
      pluginsCurrentlyInUse: null
    };
  },
  mounted() {
    this.pluginsCurrentlyInUse = this.getActivePluginTypes();
    this.loadedPluginTypes = this.getLoadedPluginTypes();
    this.deactivatedPluginTypes = this.getDeactivatedPluginTypes();
  },
  methods: {
    getPlugins() {
      let items = {};

      //registered plugins
      let keys = this.openmct.types.listKeys();
      keys.forEach((key) => {
        let typeDef = this.openmct.types.get(key).definition;
        let isChecked = this.loadedPluginTypes?.indexOf(key) >= 0 ? 1 : 0;
        let isDisabled = this.pluginsCurrentlyInUse?.indexOf(key) >= 0 ? 1 : 0;
        if (typeDef.creatable) {
          items[key] = {
            controlId: `plugin-selector-option-${uuid()}`,
            key: key,
            icon: typeDef.cssClass,
            name: typeDef.name,
            description: typeDef.description,
            ariaLabel: typeDef.name + ' plugin checkbox',
            isChecked: isChecked,
            isDisabled: isDisabled
          };
        }
      });

      //unregistered plugins
      this.deactivatedPluginTypes?.forEach((key) => {
        let typeDef = this.openmct.types.deactivatedTypes[key].definition;
        if (typeDef.creatable) {
          items[key] = {
            controlId: `plugin-selector-option-${uuid()}`,
            key: key,
            icon: typeDef.cssClass,
            name: typeDef.name,
            description: typeDef.description,
            ariaLabel: typeDef.name + ' plugin checkbox',
            isChecked: false,
            isDisabled: false
          };
        }
      });

      //sort by name
      return Object.values(items).sort((a, b) => {
        if (a.name < b.name) {
          return -1;
        } else if (a.name > b.name) {
          return 1;
        } else {
          return 0;
        }
      });
    },
    onChange(event) {
      if (!event) {
        return;
      }

      const pluginType = event.target.dataset.key;
      const isChecked = event.target.checked;

      if (isChecked) {
        if (
          this.deactivatedPluginTypes.indexOf(pluginType) >= 0 &&
          this.loadedPluginTypes.indexOf(pluginType) === -1
        ) {
          this.changes[pluginType] = isChecked;
        } else {
          delete this.changes[pluginType];
        }
      } else {
        if (
          this.pluginsCurrentlyInUse.indexOf(pluginType) === -1 &&
          this.loadedPluginTypes.indexOf(pluginType) >= 0
        ) {
          this.changes[pluginType] = isChecked;
        } else {
          delete this.changes[pluginType];
        }
      }

      const data = {
        model: this.model,
        value: this.changes
      };

      this.$emit('on-change', data);
    },
    getLoadedPluginTypes() {
      return Object.keys(this.openmct.types.types);
    },
    getDeactivatedPluginTypes() {
      return Object.keys(this.openmct.types.deactivatedTypes);
    },
    getActivePluginTypes() {
      let activeTypes = {};
      const mctStorage = JSON.parse(localStorage.getItem('mct'));
      Object.entries(mctStorage).forEach(([key, value]) => {
        if (value && value.type && value.location) {
          activeTypes[value.type] = 1;
        }
      });

      return Object.keys(activeTypes);
    }
  }
};
</script>
