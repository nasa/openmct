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
  <li class="c-inspect-properties__row">
    <div class="c-inspect-properties__label" title="Options for future events.">{{ label }}</div>
    <div class="c-inspect-properties__value">
      <select v-if="canEdit" v-model="index" @change="updateForm('index')">
        <option
          v-for="(activityOption, activityKey) in activitiesOptions"
          :key="activityKey"
          :value="activityKey"
        >
          {{ activityOption }}
        </option>
      </select>
      <span v-else>{{ activitiesOptions[index] }}</span>
    </div>
  </li>
</template>

<script>
const ACTIVITIES_OPTIONS = ["Don't show", 'Show all'];

export default {
  inject: ['openmct', 'domainObject'],
  props: {
    label: {
      type: String,
      required: true
    },
    prefix: {
      type: String,
      required: true
    }
  },
  emits: ['updated'],
  data() {
    return {
      index: this.domainObject.configuration[`${this.prefix}Index`] % 2, //this is modulo since we previously had more options and index could have been > 1
      activitiesOptions: ACTIVITIES_OPTIONS,
      isEditing: this.openmct.editor.isEditing()
    };
  },
  computed: {
    canEdit() {
      return this.isEditing && !this.domainObject.locked;
    }
  },
  mounted() {
    if (this.prefix === 'futureEvents') {
      this.activitiesOptions = ACTIVITIES_OPTIONS.slice(0, 3);
    } else if (this.prefix === 'pastEvents') {
      this.activitiesOptions = ACTIVITIES_OPTIONS.filter((item, index) => index !== 2);
    } else if (this.prefix === 'currentEvents') {
      this.activitiesOptions = ACTIVITIES_OPTIONS.slice(0, 2);
    }

    this.openmct.editor.on('isEditing', this.setEditState);
  },
  beforeUnmount() {
    this.openmct.editor.off('isEditing', this.setEditState);
  },
  methods: {
    updateForm(property) {
      if (!this.isValid()) {
        return;
      }

      const capitalized = property.charAt(0).toUpperCase() + property.substr(1);
      this.$emit('updated', {
        property: `${this.prefix}${capitalized}`,
        value: this[property]
      });
    },
    isValid() {
      return this.index <= 1;
    },
    setEditState(isEditing) {
      this.isEditing = isEditing;
    }
  }
};
</script>
