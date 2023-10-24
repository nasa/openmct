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
  <div>
    <li v-if="isStackedPlotObject" class="grid-row">
      <div class="grid-cell label" title="Display legends per sub plot.">Show legend per plot</div>
      <div class="grid-cell value">
        <input
          v-model="showLegendsForChildren"
          type="checkbox"
          @change="updateForm('showLegendsForChildren')"
        />
      </div>
    </li>
    <li class="grid-row">
      <div
        class="grid-cell label"
        title="The position of the legend relative to the plot display area."
      >
        Position
      </div>
      <div class="grid-cell value">
        <select v-model="position" @change="updateForm('position')">
          <option value="top">Top</option>
          <option value="right">Right</option>
          <option value="bottom">Bottom</option>
          <option value="left">Left</option>
        </select>
      </div>
    </li>
    <li class="grid-row">
      <div class="grid-cell label" title="Hide the legend when the plot is small">
        Hide when plot small
      </div>
      <div class="grid-cell value">
        <input
          v-model="hideLegendWhenSmall"
          type="checkbox"
          @change="updateForm('hideLegendWhenSmall')"
        />
      </div>
    </li>
    <li class="grid-row">
      <div class="grid-cell label" title="Show the legend expanded by default">
        Expand by default
      </div>
      <div class="grid-cell value">
        <input v-model="expandByDefault" type="checkbox" @change="updateForm('expandByDefault')" />
      </div>
    </li>
    <li class="grid-row">
      <div class="grid-cell label" title="What to display in the legend when it's collapsed.">
        When collapsed show
      </div>
      <div class="grid-cell value">
        <select v-model="valueToShowWhenCollapsed" @change="updateForm('valueToShowWhenCollapsed')">
          <option value="none">Nothing</option>
          <option value="nearestTimestamp">Nearest timestamp</option>
          <option value="nearestValue">Nearest value</option>
          <option value="min">Minimum value</option>
          <option value="max">Maximum value</option>
          <option value="unit">Unit</option>
        </select>
      </div>
    </li>
    <li class="grid-row">
      <div class="grid-cell label" title="What to display in the legend when it's expanded.">
        When expanded show
      </div>
      <div class="grid-cell value">
        <ul>
          <li>
            <input
              v-model="showTimestampWhenExpanded"
              type="checkbox"
              @change="updateForm('showTimestampWhenExpanded')"
            />
            Nearest timestamp
          </li>
          <li>
            <input
              v-model="showValueWhenExpanded"
              type="checkbox"
              @change="updateForm('showValueWhenExpanded')"
            />
            Nearest value
          </li>
          <li>
            <input
              v-model="showMinimumWhenExpanded"
              type="checkbox"
              @change="updateForm('showMinimumWhenExpanded')"
            />
            Minimum value
          </li>
          <li>
            <input
              v-model="showMaximumWhenExpanded"
              type="checkbox"
              @change="updateForm('showMaximumWhenExpanded')"
            />
            Maximum value
          </li>
          <li>
            <input
              v-model="showUnitsWhenExpanded"
              type="checkbox"
              @change="updateForm('showUnitsWhenExpanded')"
            />
            Unit
          </li>
        </ul>
      </div>
    </li>
  </div>
</template>
<script>
import _ from 'lodash';

import { coerce, objectPath, validate } from './formUtil';

export default {
  inject: ['openmct', 'domainObject', 'path'],
  props: {
    legend: {
      type: Object,
      default() {
        return {};
      }
    }
  },
  data() {
    return {
      position: '',
      hideLegendWhenSmall: '',
      expandByDefault: '',
      valueToShowWhenCollapsed: '',
      showTimestampWhenExpanded: '',
      showValueWhenExpanded: '',
      showMinimumWhenExpanded: '',
      showMaximumWhenExpanded: '',
      showUnitsWhenExpanded: '',
      showLegendsForChildren: '',
      validation: {}
    };
  },
  computed: {
    isStackedPlotObject() {
      return this.path.find(
        (pathObject, pathObjIndex) =>
          pathObjIndex === 0 && pathObject?.type === 'telemetry.plot.stacked'
      );
    }
  },
  mounted() {
    this.initialize();
    this.initFormValues();
  },
  methods: {
    initialize() {
      this.fields = [
        {
          modelProp: 'position',
          objectPath: 'configuration.legend.position'
        },
        {
          modelProp: 'hideLegendWhenSmall',
          coerce: Boolean,
          objectPath: 'configuration.legend.hideLegendWhenSmall'
        },
        {
          modelProp: 'expandByDefault',
          coerce: Boolean,
          objectPath: 'configuration.legend.expandByDefault'
        },
        {
          modelProp: 'valueToShowWhenCollapsed',
          objectPath: 'configuration.legend.valueToShowWhenCollapsed'
        },
        {
          modelProp: 'showValueWhenExpanded',
          coerce: Boolean,
          objectPath: 'configuration.legend.showValueWhenExpanded'
        },
        {
          modelProp: 'showTimestampWhenExpanded',
          coerce: Boolean,
          objectPath: 'configuration.legend.showTimestampWhenExpanded'
        },
        {
          modelProp: 'showMaximumWhenExpanded',
          coerce: Boolean,
          objectPath: 'configuration.legend.showMaximumWhenExpanded'
        },
        {
          modelProp: 'showMinimumWhenExpanded',
          coerce: Boolean,
          objectPath: 'configuration.legend.showMinimumWhenExpanded'
        },
        {
          modelProp: 'showUnitsWhenExpanded',
          coerce: Boolean,
          objectPath: 'configuration.legend.showUnitsWhenExpanded'
        },
        {
          modelProp: 'showLegendsForChildren',
          coerce: Boolean,
          objectPath: 'configuration.legend.showLegendsForChildren'
        }
      ];
    },
    initFormValues() {
      this.position = this.legend.get('position');
      this.hideLegendWhenSmall = this.legend.get('hideLegendWhenSmall');
      this.expandByDefault = this.legend.get('expandByDefault');
      this.valueToShowWhenCollapsed = this.legend.get('valueToShowWhenCollapsed');
      this.showTimestampWhenExpanded = this.legend.get('showTimestampWhenExpanded');
      this.showValueWhenExpanded = this.legend.get('showValueWhenExpanded');
      this.showMinimumWhenExpanded = this.legend.get('showMinimumWhenExpanded');
      this.showMaximumWhenExpanded = this.legend.get('showMaximumWhenExpanded');
      this.showUnitsWhenExpanded = this.legend.get('showUnitsWhenExpanded');
      this.showLegendsForChildren = this.legend.get('showLegendsForChildren');
    },
    updateForm(formKey) {
      const newVal = this[formKey];
      const oldVal = this.legend.get(formKey);
      const formField = this.fields.find((field) => field.modelProp === formKey);

      const path = objectPath(formField.objectPath);
      const validationResult = validate(newVal, this.legend, formField.validate);
      if (validationResult === true) {
        delete this.validation[formKey];
      } else {
        this.validation[formKey] = validationResult;

        return;
      }

      if (!_.isEqual(coerce(newVal, formField.coerce), coerce(oldVal, formField.coerce))) {
        this.legend.set(formKey, coerce(newVal, formField.coerce));
        if (path) {
          this.openmct.objects.mutate(
            this.domainObject,
            path(this.domainObject, this.legend),
            coerce(newVal, formField.coerce)
          );
        }
      }
    },
    setStatus(status) {
      this.status = status;
    }
  }
};
</script>
