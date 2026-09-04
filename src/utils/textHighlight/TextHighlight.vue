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
  <!-- eslint-disable-next-line vue/no-v-html -->
  <span v-html="highlightedText"></span>
</template>

<script>
export default {
  props: {
    text: {
      type: String,
      required: true
    },
    highlight: {
      type: String,
      default() {
        return '';
      }
    },
    highlightClass: {
      type: String,
      default() {
        return 'highlight';
      }
    }
  },
  computed: {
    highlightedText() {
      const highlight = this.highlight;

      // The highlight is free-typed search text: escape regex syntax so
      // arbitrary input (e.g. `(a`, `[unclosed`) can never throw (#8432).
      const escapedHighlight = highlight.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

      const highlightRegex = new RegExp(`(?<!<[^>]*)(${escapedHighlight})`, 'gi');

      const replacement = `<span class="${this.highlightClass}">${highlight}</span>`;

      return this.text.replace(highlightRegex, replacement);
    }
  }
};
</script>
