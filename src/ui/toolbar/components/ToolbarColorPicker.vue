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
  <div class="c-ctrl-wrapper">
    <div
      class="c-icon-button c-icon-button--swatched"
      :class="[options.icon, { 'c-icon-button--mixed': nonSpecific }]"
      :title="options.title"
      @click="handleClick"
    >
      <div
        class="c-swatch"
        :style="{
          background: options.value
        }"
      ></div>
    </div>
    <div v-if="open" class="c-menu c-palette c-palette--color">
      <div
        v-if="!options.preventNone"
        class="c-palette__item-none"
        @click="select({ value: 'transparent' })"
      >
        <div class="c-palette__item"></div>
        None
      </div>
      <div class="c-palette__items">
        <div
          v-for="(color, index) in colorPalette"
          :key="index"
          class="c-palette__item"
          :style="{ background: color.value }"
          @click="select(color)"
        ></div>
      </div>
    </div>
  </div>
</template>

<script>
import toggleMixin from '../../mixins/toggle-mixin';

export default {
  mixins: [toggleMixin],
  props: {
    options: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      colorPalette: [
        { value: '#000000' },
        { value: '#434343' },
        { value: '#666666' },
        { value: '#999999' },
        { value: '#b7b7b7' },
        { value: '#cccccc' },
        { value: '#d9d9d9' },
        { value: '#efefef' },
        { value: '#f3f3f3' },
        { value: '#ffffff' },
        { value: '#980000' },
        { value: '#ff0000' },
        { value: '#ff9900' },
        { value: '#ffff00' },
        { value: '#00ff00' },
        { value: '#00ffff' },
        { value: '#4a86e8' },
        { value: '#0000ff' },
        { value: '#9900ff' },
        { value: '#ff00ff' },
        { value: '#e6b8af' },
        { value: '#f4cccc' },
        { value: '#fce5cd' },
        { value: '#fff2cc' },
        { value: '#d9ead3' },
        { value: '#d0e0e3' },
        { value: '#c9daf8' },
        { value: '#cfe2f3' },
        { value: '#d9d2e9' },
        { value: '#ead1dc' },
        { value: '#dd7e6b' },
        { value: '#dd7e6b' },
        { value: '#f9cb9c' },
        { value: '#ffe599' },
        { value: '#b6d7a8' },
        { value: '#a2c4c9' },
        { value: '#a4c2f4' },
        { value: '#9fc5e8' },
        { value: '#b4a7d6' },
        { value: '#d5a6bd' },
        { value: '#cc4125' },
        { value: '#e06666' },
        { value: '#f6b26b' },
        { value: '#ffd966' },
        { value: '#93c47d' },
        { value: '#76a5af' },
        { value: '#6d9eeb' },
        { value: '#6fa8dc' },
        { value: '#8e7cc3' },
        { value: '#c27ba0' },
        { value: '#a61c00' },
        { value: '#cc0000' },
        { value: '#e69138' },
        { value: '#f1c232' },
        { value: '#6aa84f' },
        { value: '#45818e' },
        { value: '#3c78d8' },
        { value: '#3d85c6' },
        { value: '#674ea7' },
        { value: '#a64d79' },
        { value: '#85200c' },
        { value: '#990000' },
        { value: '#b45f06' },
        { value: '#bf9000' },
        { value: '#38761d' },
        { value: '#134f5c' },
        { value: '#1155cc' },
        { value: '#0b5394' },
        { value: '#351c75' },
        { value: '#741b47' },
        { value: '#5b0f00' },
        { value: '#660000' },
        { value: '#783f04' },
        { value: '#7f6000' },
        { value: '#274e13' },
        { value: '#0c343d' },
        { value: '#1c4587' },
        { value: '#073763' },
        { value: '#20124d' },
        { value: '#4c1130' }
      ]
    };
  },
  computed: {
    nonSpecific() {
      return this.options.nonSpecific === true;
    }
  },
  methods: {
    select(color) {
      if (color.value !== this.options.value) {
        this.$emit('change', color.value, this.options);
      }
    },
    handleClick(event) {
      if (this.options.isEditing === undefined || this.options.isEditing) {
        this.toggle(event);
      }
    }
  }
};
</script>
