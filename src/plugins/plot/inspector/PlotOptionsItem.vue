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
  <li class="c-tree__item menus-to-left" :class="isAliasClass" :aria-label="ariaLabel">
    <span
      class="c-disclosure-triangle is-enabled flex-elem"
      :class="expandedCssClass"
      role="button"
      :aria-label="ariaLabelExpandCollapse"
      tabindex="0"
      @click="toggleExpanded"
      @keydown.enter="toggleExpanded"
    ></span>
    <div class="c-object-label" :class="statusClass">
      <div class="c-object-label__type-icon" :class="getSeriesClass">
        <span class="is-status__indicator" title="This item is missing or suspect"></span>
      </div>
      <div class="c-object-label__name">{{ series.domainObject.name }}</div>
    </div>
  </li>
  <li v-show="expanded" class="c-tree__item menus-to-left" role="table">
    <ul class="grid-properties js-plot-options-browse-properties" role="rowgroup">
      <li class="grid-row" role="row">
        <div
          class="grid-cell label"
          title="The field to be plotted as a value for this series."
          role="cell"
        >
          Value
        </div>
        <div class="grid-cell value" role="cell">
          {{ yKey }}
        </div>
      </li>
      <li class="grid-row" role="row">
        <div
          class="grid-cell label"
          title="The rendering method to join lines for this series."
          role="cell"
        >
          Line Method
        </div>
        <div class="grid-cell value" role="cell">
          {{
            {
              none: 'None',
              linear: 'Linear interpolation',
              stepAfter: 'Step After'
            }[interpolate]
          }}
        </div>
      </li>
      <li class="grid-row" role="row">
        <div
          class="grid-cell label"
          title="Whether markers are displayed, and their size."
          role="cell"
        >
          Markers
        </div>
        <div class="grid-cell value" role="cell">
          {{ markerOptionsDisplayText }}
        </div>
      </li>
      <li class="grid-row" role="row" title="Display markers visually denoting points in alarm.">
        <div class="grid-cell label" role="cell">Alarm Markers</div>
        <div class="grid-cell value" role="cell">
          {{ alarmMarkers ? 'Enabled' : 'Disabled' }}
        </div>
      </li>
      <li class="grid-row" role="row">
        <div
          class="grid-cell label"
          title="Display lines visually denoting alarm limits."
          role="cell"
        >
          Limit Lines
        </div>
        <div class="grid-cell value" role="cell">
          {{ limitLines ? 'Enabled' : 'Disabled' }}
        </div>
      </li>
      <ColorSwatch
        :current-color="seriesHexColor"
        edit-title="Manually set the plot line and marker color for this series."
        view-title="The plot line and marker color for this series."
        short-label="Color"
      />
    </ul>
  </li>
</template>

<script>
import ColorSwatch from '@/ui/color/ColorSwatch.vue';

export default {
  components: {
    ColorSwatch
  },
  inject: ['openmct', 'domainObject', 'path'],
  props: {
    series: {
      type: Object,
      default() {
        return {};
      }
    }
  },
  data() {
    return {
      expanded: false,
      status: null
    };
  },
  computed: {
    ariaLabel() {
      return this.series?.domainObject?.name ?? '';
    },
    ariaLabelExpandCollapse() {
      const name = this.series.domainObject.name ? ` ${this.series.domainObject.name}` : '';

      return `${this.expanded ? 'Collapse' : 'Expand'}${name} Plot Series Options`;
    },
    isAliasClass() {
      let cssClass = '';
      const domainObjectPath = [this.series.domainObject, ...this.path];
      if (this.openmct.objects.isObjectPathToALink(this.series.domainObject, domainObjectPath)) {
        cssClass = 'is-alias';
      }

      return cssClass;
    },
    getSeriesClass() {
      let cssClass = '';
      let type = this.openmct.types.get(this.series.domainObject.type);
      if (type.definition.cssClass) {
        cssClass = `${cssClass} ${type.definition.cssClass}`;
      }

      return cssClass;
    },
    expandedCssClass() {
      if (this.expanded === true) {
        return 'c-disclosure-triangle--expanded';
      }

      return '';
    },
    statusClass() {
      return this.status ? `is-status--${this.status}` : '';
    },
    yKey() {
      return this.series.get('yKey');
    },
    interpolate() {
      return this.series.get('interpolate');
    },
    markerOptionsDisplayText() {
      return this.series.markerOptionsDisplayText();
    },
    alarmMarkers() {
      return this.series.get('alarmMarkers');
    },
    limitLines() {
      return this.series.get('limitLines');
    },
    seriesHexColor() {
      return this.series.get('color').asHexString();
    }
  },
  created() {
    this.status = this.openmct.status.get(this.series.domainObject.identifier);
    this.removeStatusListener = this.openmct.status.observe(
      this.series.domainObject.identifier,
      this.setStatus
    );
  },
  beforeUnmount() {
    if (this.removeStatusListener) {
      this.removeStatusListener();
    }
  },
  methods: {
    toggleExpanded() {
      this.expanded = !this.expanded;
    },
    setStatus(status) {
      this.status = status;
    }
  }
};
</script>
