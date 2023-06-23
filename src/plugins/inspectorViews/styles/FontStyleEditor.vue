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
  <div class="c-toolbar">
    <div ref="fontSizeMenu" class="c-menu-button c-ctrl-wrapper c-ctrl-wrapper--menus-left">
      <button
        class="c-icon-button c-button--menu icon-font-size"
        @click.prevent.stop="showFontSizeMenu"
      >
        <span class="c-button__label">{{ fontSizeLabel }}</span>
      </button>
    </div>
    <div ref="fontMenu" class="c-menu-button c-ctrl-wrapper c-ctrl-wrapper--menus-left">
      <button class="c-icon-button c-button--menu icon-font" @click.prevent.stop="showFontMenu">
        <span class="c-button__label">{{ fontTypeLabel }}</span>
      </button>
    </div>
  </div>
</template>

<script>
import { FONT_SIZES, FONTS } from './constants';

export default {
  inject: ['openmct'],
  props: {
    fontStyle: {
      type: Object,
      required: true,
      default: () => {
        return {};
      }
    }
  },
  computed: {
    fontTypeLabel() {
      const fontType = FONTS.find((f) => f.value === this.fontStyle.font);
      if (!fontType) {
        return '??';
      }

      return fontType.name || fontType.value || FONTS[0].name;
    },
    fontSizeLabel() {
      const fontSize = FONT_SIZES.find((f) => f.value === this.fontStyle.fontSize);
      if (!fontSize) {
        return '??';
      }

      return fontSize.name || fontSize.value || FONT_SIZES[0].name;
    },
    fontMenu() {
      return FONTS.map((font) => {
        return {
          cssClass: font.cssClass || '',
          name: font.name,
          description: font.name,
          onItemClicked: () => this.setFont(font.value)
        };
      });
    },
    fontSizeMenu() {
      return FONT_SIZES.map((fontSize) => {
        return {
          cssClass: fontSize.cssClass || '',
          name: fontSize.name,
          description: fontSize.name,
          onItemClicked: () => this.setFontSize(fontSize.value)
        };
      });
    }
  },
  methods: {
    setFont(font) {
      this.$emit('set-font-property', { font });
    },
    setFontSize(fontSize) {
      this.$emit('set-font-property', { fontSize });
    },
    showFontMenu() {
      const elementBoundingClientRect = this.$refs.fontMenu.getBoundingClientRect();
      const x = elementBoundingClientRect.x;
      const y = elementBoundingClientRect.bottom;

      this.openmct.menus.showMenu(x, y, this.fontMenu);
    },
    showFontSizeMenu() {
      const elementBoundingClientRect = this.$refs.fontSizeMenu.getBoundingClientRect();
      const x = elementBoundingClientRect.x;
      const y = elementBoundingClientRect.bottom;

      this.openmct.menus.showMenu(x, y, this.fontSizeMenu);
    }
  }
};
</script>
