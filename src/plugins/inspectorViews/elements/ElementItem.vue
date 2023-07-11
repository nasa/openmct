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
  <li
    draggable="true"
    @dragstart="emitDragStartEvent"
    @dragenter="onDragenter"
    @dragover.prevent
    @dragleave="onDragleave"
    @drop="emitDropEvent"
  >
    <div
      class="c-tree__item c-elements-pool__item js-elements-pool__item"
      :class="{
        'is-context-clicked': contextClickActive,
        hover: hover,
        'is-alias': isAlias
      }"
    >
      <span class="c-elements-pool__grippy c-grippy c-grippy--vertical-drag"></span>
      <object-label
        :domain-object="elementObject"
        :object-path="[elementObject, domainObject]"
        @context-click-active="setContextClickState"
      />
    </div>
  </li>
</template>

<script>
import ObjectLabel from '../../../ui/components/ObjectLabel.vue';

export default {
  components: {
    ObjectLabel
  },
  inject: ['openmct', 'domainObject'],
  props: {
    index: {
      type: Number,
      required: true,
      default: () => {
        return 0;
      }
    },
    elementObject: {
      type: Object,
      required: true,
      default: () => {
        return {};
      }
    },
    allowDrop: {
      type: Boolean
    }
  },
  data() {
    const isAlias =
      this.elementObject.location !==
      this.openmct.objects.makeKeyString(this.domainObject.identifier);

    return {
      contextClickActive: false,
      hover: false,
      isAlias
    };
  },
  methods: {
    emitDropEvent(event) {
      this.$emit('drop-custom', event);
      this.hover = false;
    },
    emitDragStartEvent(event) {
      this.$emit('dragstart-custom', this.index);
    },
    onDragenter(event) {
      if (this.allowDrop) {
        this.hover = true;
        this.dragElement = event.target.parentElement;
      }
    },
    onDragleave(event) {
      if (event.target.parentElement === this.dragElement) {
        this.hover = false;
        delete this.dragElement;
      }
    },
    setContextClickState(state) {
      this.contextClickActive = state;
    }
  }
};
</script>
