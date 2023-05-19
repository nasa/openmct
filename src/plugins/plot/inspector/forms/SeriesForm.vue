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
    <li class="c-tree__item menus-to-left" :class="isAliasCss">
      <span
        class="c-disclosure-triangle is-enabled flex-elem"
        :class="expandedCssClass"
        @click="toggleExpanded"
      >
      </span>
      <div :class="objectLabelCss">
        <div class="c-object-label__type-icon" :class="[seriesCss]">
          <span class="is-status__indicator" title="This item is missing or suspect"></span>
        </div>
        <div class="c-object-label__name">{{ series.domainObject.name }}</div>
      </div>
    </li>
    <ul v-show="expanded" class="grid-properties js-plot-options-edit-properties">
      <li class="grid-row">
        <!-- Value to be displayed -->
        <div class="grid-cell label" title="The field to be plotted as a value for this series.">
          Value
        </div>
        <div class="grid-cell value">
          <select v-model="yKey" @change="updateForm('yKey')">
            <option
              v-for="option in yKeyOptions"
              :key="option.value"
              :value="option.value"
              :selected="option.value == yKey"
            >
              {{ option.name }}
            </option>
          </select>
        </div>
      </li>
      <li class="grid-row">
        <div class="grid-cell label" title="The rendering method to join lines for this series.">
          Line Method
        </div>
        <div class="grid-cell value">
          <select v-model="interpolate" @change="updateForm('interpolate')">
            <option value="none">None</option>
            <option value="linear">Linear interpolate</option>
            <option value="stepAfter">Step after</option>
          </select>
        </div>
      </li>
      <li class="grid-row">
        <div class="grid-cell label" title="Whether markers are displayed.">Markers</div>
        <div class="grid-cell value">
          <input v-model="markers" type="checkbox" @change="updateForm('markers')" />
          <select v-show="markers" v-model="markerShape" @change="updateForm('markerShape')">
            <option
              v-for="option in markerShapeOptions"
              :key="option.value"
              :value="option.value"
              :selected="option.value == markerShape"
            >
              {{ option.name }}
            </option>
          </select>
        </div>
      </li>
      <li class="grid-row">
        <div class="grid-cell label" title="Display markers visually denoting points in alarm.">
          Alarm Markers
        </div>
        <div class="grid-cell value">
          <input v-model="alarmMarkers" type="checkbox" @change="updateForm('alarmMarkers')" />
        </div>
      </li>
      <li class="grid-row">
        <div class="grid-cell label" title="Display limit lines">Limit lines</div>
        <div class="grid-cell value">
          <input v-model="limitLines" type="checkbox" @change="updateForm('limitLines')" />
        </div>
      </li>
      <li v-show="markers || alarmMarkers" class="grid-row">
        <div class="grid-cell label" title="The size of regular and alarm markers for this series.">
          Marker Size:
        </div>
        <div class="grid-cell value">
          <input
            v-model="markerSize"
            class="c-input--flex"
            type="text"
            @change="updateForm('markerSize')"
          />
        </div>
      </li>
      <li v-show="interpolate !== 'none' || markers" class="grid-row">
        <ColorSwatch
          :current-color="currentColor"
          edit-title="Manually set the plot line and marker color for this series."
          view-title="The plot line and marker color for this series."
          short-label="Color"
          @colorSet="setColor"
        />
      </li>
    </ul>
  </ul>
</template>

<script>
import ColorSwatch from '@/ui/color/ColorSwatch.vue';
import { MARKER_SHAPES } from '../../draw/MarkerShapes';
import { objectPath, validate, coerce } from './formUtil';
import _ from 'lodash';

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
      markerShapeOptions: [],
      yKey: this.series.get('yKey'),
      yKeyOptions: [],
      interpolate: this.series.get('interpolate'),
      markers: this.series.get('markers'),
      markerShape: this.series.get('markerShape'),
      alarmMarkers: this.series.get('alarmMarkers'),
      limitLines: this.series.get('limitLines'),
      markerSize: this.series.get('markerSize'),
      validation: {},
      swatchActive: false
    };
  },
  computed: {
    colorPalette() {
      return this.series.collection.palette.groups();
    },
    objectLabelCss() {
      return this.status ? `c-object-label is-status--${this.status}'` : 'c-object-label';
    },
    seriesCss() {
      let type = this.openmct.types.get(this.series.domainObject.type);

      return type.definition.cssClass
        ? `c-object-label__type-icon ${type.definition.cssClass}`
        : `c-object-label__type-icon`;
    },
    isAliasCss() {
      let cssClass = '';
      const domainObjectPath = [this.series.domainObject, ...this.path];
      if (this.openmct.objects.isObjectPathToALink(this.series.domainObject, domainObjectPath)) {
        cssClass = 'is-alias';
      }

      return cssClass;
    },
    expandedCssClass() {
      return this.expanded ? 'c-disclosure-triangle--expanded' : '';
    },
    currentColor() {
      return this.series.get('color').asHexString();
    }
  },
  mounted() {
    this.initialize();

    this.status = this.openmct.status.get(this.series.domainObject.identifier);
    this.removeStatusListener = this.openmct.status.observe(
      this.series.domainObject.identifier,
      this.setStatus
    );
  },
  beforeDestroy() {
    if (this.removeStatusListener) {
      this.removeStatusListener();
    }
  },
  methods: {
    initialize: function () {
      this.fields = [
        {
          modelProp: 'yKey',
          objectPath: this.dynamicPathForKey('yKey')
        },
        {
          modelProp: 'interpolate',
          objectPath: this.dynamicPathForKey('interpolate')
        },
        {
          modelProp: 'markers',
          objectPath: this.dynamicPathForKey('markers')
        },
        {
          modelProp: 'markerShape',
          objectPath: this.dynamicPathForKey('markerShape')
        },
        {
          modelProp: 'markerSize',
          coerce: Number,
          objectPath: this.dynamicPathForKey('markerSize')
        },
        {
          modelProp: 'alarmMarkers',
          coerce: Boolean,
          objectPath: this.dynamicPathForKey('alarmMarkers')
        },
        {
          modelProp: 'limitLines',
          coerce: Boolean,
          objectPath: this.dynamicPathForKey('limitLines')
        }
      ];

      const metadata = this.series.metadata;
      this.yKeyOptions = metadata.valuesForHints(['range']).map(function (o) {
        return {
          name: o.key,
          value: o.key
        };
      });
      this.markerShapeOptions = Object.entries(MARKER_SHAPES).map(([key, obj]) => {
        return {
          name: obj.label,
          value: key
        };
      });
    },
    dynamicPathForKey(key) {
      return function (object, model) {
        const modelIdentifier = model.get('identifier');
        const index = object.configuration.series.findIndex((s) => {
          return _.isEqual(s.identifier, modelIdentifier);
        });

        return 'configuration.series[' + index + '].' + key;
      };
    },
    /**
     * Set the color for the current plot series.  If the new color was
     * already assigned to a different plot series, then swap the colors.
     */
    setColor: function (color) {
      const oldColor = this.series.get('color');
      const otherSeriesWithColor = this.series.collection.filter(function (s) {
        return s.get('color') === color;
      })[0];

      this.series.set('color', color);

      if (!this.domainObject.configuration || !this.domainObject.configuration.series) {
        this.$emit('seriesUpdated', {
          identifier: this.domainObject.identifier,
          path: `series.color`,
          value: color.asHexString()
        });
      } else {
        const getPath = this.dynamicPathForKey('color');
        const seriesColorPath = getPath(this.domainObject, this.series);

        this.openmct.objects.mutate(this.domainObject, seriesColorPath, color.asHexString());
      }

      if (otherSeriesWithColor) {
        otherSeriesWithColor.set('color', oldColor);

        if (!this.domainObject.configuration || !this.domainObject.configuration.series) {
          this.$emit('seriesUpdated', {
            identifier: this.domainObject.identifier,
            path: `series.color`,
            value: oldColor.asHexString()
          });
        } else {
          const getPath = this.dynamicPathForKey('color');
          const otherSeriesColorPath = getPath(this.domainObject, otherSeriesWithColor);

          this.openmct.objects.mutate(
            this.domainObject,
            otherSeriesColorPath,
            oldColor.asHexString()
          );
        }
      }
    },
    toggleExpanded() {
      this.expanded = !this.expanded;
    },
    updateForm(formKey) {
      const newVal = this[formKey];
      const oldVal = this.series.get(formKey);
      const formField = this.fields.find((field) => field.modelProp === formKey);

      const path = objectPath(formField.objectPath);
      const validationResult = validate(newVal, this.series, formField.validate);
      if (validationResult === true) {
        delete this.validation[formKey];
      } else {
        this.validation[formKey] = validationResult;

        return;
      }

      if (!_.isEqual(coerce(newVal, formField.coerce), coerce(oldVal, formField.coerce))) {
        this.series.set(formKey, coerce(newVal, formField.coerce));
        if (path) {
          if (!this.domainObject.configuration || !this.domainObject.configuration.series) {
            this.$emit('seriesUpdated', {
              identifier: this.domainObject.identifier,
              path: `series.${formKey}`,
              value: coerce(newVal, formField.coerce)
            });
          } else {
            this.openmct.objects.mutate(
              this.domainObject,
              path(this.domainObject, this.series),
              coerce(newVal, formField.coerce)
            );
          }
        }
      }
    },
    setStatus(status) {
      this.status = status;
    },
    toggleSwatch() {
      this.swatchActive = !this.swatchActive;
    }
  }
};
</script>
