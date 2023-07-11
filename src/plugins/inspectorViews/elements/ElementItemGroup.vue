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
  <div
    class="c-elements-pool__group"
    :class="{
      hover: hover
    }"
    :allow-drop="allowDrop"
    @dragover.prevent
    @dragenter="onDragEnter"
    @dragleave.stop="onDragLeave"
    @drop="emitDrop"
  >
    <ul>
      <div>
        <span class="c-elements-pool__grippy c-grippy c-grippy--vertical-drag"></span>
        <div class="c-tree__item__type-icon c-object-label__type-icon">
          <span class="is-status__indicator"></span>
        </div>
        <div
          class="c-tree__item__name c-object-label__name"
          :aria-label="`Element Item Group ${label}`"
        >
          {{ label }}
        </div>
      </div>
      <slot></slot>
    </ul>
  </div>
</template>

<script>
export default {
  props: {
    parentObject: {
      type: Object,
      required: true,
      default: () => {
        return {};
      }
    },
    label: {
      type: String,
      required: true,
      default: () => {
        return '';
      }
    },
    allowDrop: {
      type: Boolean
    }
  },
  data() {
    return {
      dragCounter: 0
    };
  },
  computed: {
    hover() {
      return this.dragCounter > 0;
    }
  },
  methods: {
    emitDrop(event) {
      this.dragCounter = 0;
      this.$emit('drop-group', event);
    },
    onDragEnter(event) {
      this.dragCounter++;
    },
    onDragLeave(event) {
      this.dragCounter--;
    }
  }
};
</script>
