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
  <div class="c-inspector__properties c-inspect-properties">
    <div v-if="properties.length" class="u-contents">
      <div class="c-inspect-properties__header">{{ heading }}</div>
      <ul v-for="property in properties" :key="property.id" class="c-inspect-properties__section">
        <activity-property :label="property.label" :value="property.value" />
      </ul>
    </div>
  </div>
</template>

<script>
import ActivityProperty from './ActivityProperty.vue';

export default {
  components: {
    ActivityProperty
  },
  props: {
    activity: {
      type: Object,
      required: true
    },
    heading: {
      type: String,
      required: true
    }
  },
  data() {
    return {
      properties: []
    };
  },
  mounted() {
    this.setProperties();
  },
  methods: {
    setProperties() {
      if (!this.activity.metadata) {
        return;
      }

      Object.keys(this.activity.metadata).forEach((key) => {
        if (this.activity.metadata[key].label) {
          const label = this.activity.metadata[key].label;
          const value = String(this.activity.metadata[key].value);
          const id = this.activity.id;

          this.properties[this.properties.length] = {
            id,
            label,
            value
          };
        }
      });
    }
  }
};
</script>
