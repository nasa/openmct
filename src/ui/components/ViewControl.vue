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
  <span
    :class="[controlClass, { 'c-disclosure-triangle--expanded': value }, { 'is-enabled': enabled }]"
    tabindex="0"
    role="button"
    :aria-label="ariaLabelValue"
    :aria-expanded="value ? 'true' : 'false'"
    @click="handleClick"
    @keydown.enter="handleClick"
  ></span>
</template>

<script>
export default {
  props: {
    value: {
      type: Boolean,
      default: false
    },
    enabled: {
      // Provided to allow the view-control to still occupy space without displaying a control icon.
      // Used as such in the tree - when a node doesn't have children, set disabled to true.
      type: Boolean,
      default: false
    },
    controlClass: {
      type: String,
      default: 'c-disclosure-triangle'
    },
    domainObject: {
      type: Object,
      default: () => {}
    }
  },
  computed: {
    ariaLabelValue() {
      const name = this.domainObject.name ? ` ${this.domainObject.name}` : '';
      const type = this.domainObject.type ? ` ${this.domainObject.type}` : '';

      return `${this.value ? 'Collapse' : 'Expand'}${name}${type}`;
    }
  },
  methods: {
    handleClick(event) {
      event.stopPropagation();
      this.$emit('input', !this.value);
    }
  }
};
</script>
