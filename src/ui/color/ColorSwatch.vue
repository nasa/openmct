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
  <div class="grid-row grid-row--pad-label-for-button">
    <template v-if="canEdit">
      <div class="grid-cell label" :title="editTitle">{{ shortLabel }}</div>
      <div class="grid-cell value">
        <div class="c-click-swatch c-click-swatch--menu" @click="toggleSwatch()">
          <span class="c-color-swatch" :style="{ background: currentColor }"> </span>
        </div>
        <div class="c-palette c-palette--color">
          <div v-show="swatchActive" class="c-palette__items">
            <div v-for="group in colorPaletteGroups" :key="group.id" class="u-contents">
              <div
                v-for="color in group"
                :key="color.id"
                class="c-palette__item"
                :class="{ selected: currentColor === color.hexString }"
                :style="{ background: color.hexString }"
                @click="setColor(color)"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </template>
    <template v-else>
      <div class="grid-cell label" :title="viewTitle">{{ shortLabel }}</div>
      <div class="grid-cell value">
        <span
          class="c-color-swatch"
          :style="{
            background: currentColor
          }"
        >
        </span>
      </div>
    </template>
  </div>
</template>

<script>
import ColorPalette from './ColorPalette';

export default {
  inject: ['openmct', 'domainObject'],
  props: {
    currentColor: {
      type: String,
      default() {
        return '';
      }
    },
    editTitle: {
      type: String,
      default() {
        return 'Set the color.';
      }
    },
    viewTitle: {
      type: String,
      default() {
        return 'The current color.';
      }
    },
    shortLabel: {
      type: String,
      default() {
        return 'Color';
      }
    }
  },
  data() {
    return {
      swatchActive: false,
      colorPaletteGroups: [],
      isEditing: this.openmct.editor.isEditing()
    };
  },
  computed: {
    canEdit() {
      return this.isEditing && !this.domainObject.locked;
    }
  },
  mounted() {
    this.colorPalette = new ColorPalette();
    this.openmct.editor.on('isEditing', this.setEditState);
    this.initialize();
  },
  beforeUnmount() {
    this.openmct.editor.off('isEditing', this.setEditState);
  },
  methods: {
    initialize() {
      const colorPaletteGroups = this.colorPalette.groups();
      colorPaletteGroups.forEach((group, index) => {
        let groupId = [];
        group.forEach((color) => {
          color.hexString = color.asHexString();
          color.id = `${color.hexString}-${index}`;
          groupId.push(color.id);
        });
        group.id = groupId.join('-');
      });
      this.colorPaletteGroups = colorPaletteGroups;
    },
    setEditState(isEditing) {
      this.isEditing = isEditing;
    },
    setColor(chosenColor) {
      this.$emit('colorSet', chosenColor);
    },
    toggleSwatch() {
      this.swatchActive = !this.swatchActive;
    }
  }
};
</script>
