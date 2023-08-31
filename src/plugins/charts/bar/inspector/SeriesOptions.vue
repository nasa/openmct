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
  <ul>
    <li class="c-tree__item menus-to-left" :class="aliasCss">
      <span
        class="c-disclosure-triangle is-enabled flex-elem"
        :class="expandedCssClass"
        @click="expanded = !expanded"
      >
      </span>

      <div class="c-object-label">
        <div :class="[seriesCss]"></div>
        <div class="c-object-label__name">{{ name }}</div>
      </div>
    </li>
    <ul class="grid-properties">
      <li class="grid-row">
        <ColorSwatch
          v-if="expanded"
          :current-color="currentColor"
          title="Manually set the color for this bar graph series."
          edit-title="Manually set the color for this bar graph series."
          view-title="The color for this bar graph series."
          short-label="Color"
          @colorSet="setColor"
        />
      </li>
    </ul>
  </ul>
</template>

<script>
import ColorSwatch from '@/ui/color/ColorSwatch.vue';
import Color from '@/ui/color/Color';

export default {
  components: {
    ColorSwatch
  },
  inject: ['openmct', 'domainObject'],
  props: {
    item: {
      type: Object,
      required: true
    },
    colorPalette: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      currentColor: undefined,
      name: '',
      type: '',
      isAlias: false,
      expanded: false
    };
  },
  computed: {
    expandedCssClass() {
      return this.expanded ? 'c-disclosure-triangle--expanded' : '';
    },
    seriesCss() {
      const type = this.openmct.types.get(this.type);
      if (type && type.definition && type.definition.cssClass) {
        return `c-object-label__type-icon ${type.definition.cssClass}`;
      }

      return 'c-object-label__type-icon';
    },
    aliasCss() {
      let cssClass = '';
      if (this.isAlias) {
        cssClass = 'is-alias';
      }

      return cssClass;
    }
  },
  watch: {
    item: {
      handler() {
        this.initColorAndName();
      },
      deep: true
    }
  },
  mounted() {
    this.initColorAndName();
    this.removeBarStylesListener = this.openmct.objects.observe(
      this.domainObject,
      `configuration.barStyles.series["${this.key}"]`,
      this.initColorAndName
    );
  },
  beforeUnmount() {
    if (this.removeBarStylesListener) {
      this.removeBarStylesListener();
    }
  },
  methods: {
    initColorAndName() {
      this.key = this.openmct.objects.makeKeyString(this.item.identifier);
      // this is called before the plot is initialized
      if (!this.domainObject.configuration.barStyles.series[this.key]) {
        const color = this.colorPalette.getNextColor().asHexString();
        this.domainObject.configuration.barStyles.series[this.key] = {
          color,
          type: '',
          name: '',
          isAlias: false
        };
      } else if (!this.domainObject.configuration.barStyles.series[this.key].color) {
        this.domainObject.configuration.barStyles.series[this.key].color = this.colorPalette
          .getNextColor()
          .asHexString();
      }

      this.currentColor = this.domainObject.configuration.barStyles.series[this.key].color;
      this.name = this.domainObject.configuration.barStyles.series[this.key].name;
      this.type = this.domainObject.configuration.barStyles.series[this.key].type;
      this.isAlias = this.domainObject.configuration.barStyles.series[this.key].isAlias;

      let colorHexString = this.currentColor;
      const colorObject = Color.fromHexString(colorHexString);

      this.colorPalette.remove(colorObject);
    },
    setColor(chosenColor) {
      this.currentColor = chosenColor.asHexString();
      this.openmct.objects.mutate(
        this.domainObject,
        `configuration.barStyles.series["${this.key}"].color`,
        this.currentColor
      );
    }
  }
};
</script>
