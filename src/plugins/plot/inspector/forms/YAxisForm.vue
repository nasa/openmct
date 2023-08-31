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
  <div v-if="loaded">
    <ul
      class="l-inspector-part"
      :aria-label="id > 1 ? `Y Axis ${id} Properties` : 'Y Axis Properties'"
    >
      <h2>Y Axis {{ id > 1 ? id : '' }}</h2>
      <li class="grid-row">
        <div class="grid-cell label" title="Manually override how the Y axis is labeled.">
          Label
        </div>
        <div class="grid-cell value">
          <input v-model="label" class="c-input--flex" type="text" @change="updateForm('label')" />
        </div>
      </li>
      <li class="grid-row">
        <div id="log-mode-checkbox" class="grid-cell label" title="Enable log mode.">Log mode</div>
        <div class="grid-cell value">
          <!-- eslint-disable-next-line vue/html-self-closing -->
          <input
            v-model="logMode"
            class="js-log-mode-input"
            aria-labelledby="log-mode-checkbox"
            type="checkbox"
            @change="updateForm('logMode')"
          />
        </div>
      </li>
      <li class="grid-row">
        <div
          id="autoscale-checkbox"
          class="grid-cell label"
          title="Automatically scale the Y axis to keep all values in view."
        >
          Auto scale
        </div>
        <div class="grid-cell value">
          <input
            v-model="autoscale"
            type="checkbox"
            aria-labelledby="autoscale-checkbox"
            @change="updateForm('autoscale')"
          />
        </div>
      </li>
      <li v-show="autoscale" class="grid-row">
        <div
          class="grid-cell label"
          title="Percentage of padding above and below plotted min and max values. 0.1, 1.0, etc."
        >
          Padding
        </div>
        <div class="grid-cell value">
          <input
            v-model="autoscalePadding"
            class="c-input--flex"
            type="text"
            @change="updateForm('autoscalePadding')"
          />
        </div>
      </li>
    </ul>
    <ul v-show="!autoscale" class="l-inspector-part">
      <div v-show="!autoscale && validationErrors.range" class="grid-span-all form-error">
        {{ validationErrors.range }}
      </div>
      <li class="grid-row force-border">
        <div class="grid-cell label" title="Minimum Y axis value.">Minimum Value</div>
        <div class="grid-cell value">
          <input
            v-model.lazy="rangeMin"
            class="c-input--flex"
            type="number"
            @change="updateForm('range')"
          />
        </div>
      </li>
      <li class="grid-row">
        <div class="grid-cell label" title="Maximum Y axis value.">Maximum Value</div>
        <div class="grid-cell value">
          <input
            v-model.lazy="rangeMax"
            class="c-input--flex"
            type="number"
            @change="updateForm('range')"
          />
        </div>
      </li>
    </ul>
  </div>
</template>

<script>
import { objectPath } from './formUtil';
import _ from 'lodash';
import eventHelpers from '../../lib/eventHelpers';
import configStore from '../../configuration/ConfigStore';

export default {
  inject: ['openmct', 'domainObject'],
  props: {
    id: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      yAxis: null,
      label: '',
      autoscale: '',
      logMode: false,
      autoscalePadding: '',
      rangeMin: '',
      rangeMax: '',
      validationErrors: {},
      loaded: false
    };
  },
  beforeUnmount() {
    if (this.autoscale === false && this.validationErrors.range) {
      this.autoscale = true;
      this.updateForm('autoscale');
    }
  },
  mounted() {
    eventHelpers.extend(this);
    this.getConfig();
    this.loaded = true;
    this.initFields();
    this.initFormValues();
  },
  methods: {
    getConfig() {
      const configId = this.openmct.objects.makeKeyString(this.domainObject.identifier);
      const config = configStore.get(configId);
      if (config) {
        const mainYAxisId = config.yAxis.id;
        this.isAdditionalYAxis = this.id !== mainYAxisId;
        if (this.isAdditionalYAxis) {
          this.additionalYAxes = config.additionalYAxes;
          this.yAxis = config.additionalYAxes.find((yAxis) => yAxis.id === this.id);
        } else {
          this.yAxis = config.yAxis;
        }
      }
    },
    initFields() {
      const prefix = `configuration.${this.getPrefix()}`;
      this.fields = {
        label: {
          objectPath: `${prefix}.label`
        },
        autoscale: {
          coerce: Boolean,
          objectPath: `${prefix}.autoscale`
        },
        autoscalePadding: {
          coerce: Number,
          objectPath: `${prefix}.autoscalePadding`
        },
        logMode: {
          coerce: Boolean,
          objectPath: `${prefix}.logMode`
        },
        range: {
          objectPath: `${prefix}.range`,
          coerce: function coerceRange(range) {
            const newRange = {};

            if (range && typeof range.min !== 'undefined' && range.min !== null) {
              newRange.min = Number(range.min);
            }

            if (range && typeof range.max !== 'undefined' && range.max !== null) {
              newRange.max = Number(range.max);
            }

            return newRange;
          },
          validate: function validateRange(range, model) {
            if (!range) {
              return 'Need range';
            }

            if (range.min === '' || range.min === null || typeof range.min === 'undefined') {
              return 'Must specify Minimum';
            }

            if (range.max === '' || range.max === null || typeof range.max === 'undefined') {
              return 'Must specify Maximum';
            }

            if (Number.isNaN(Number(range.min))) {
              return 'Minimum must be a number.';
            }

            if (Number.isNaN(Number(range.max))) {
              return 'Maximum must be a number.';
            }

            if (Number(range.min) > Number(range.max)) {
              return 'Minimum must be less than Maximum.';
            }
          }
        }
      };
    },
    initFormValues() {
      this.label = this.yAxis.get('label');
      this.autoscale = this.yAxis.get('autoscale');
      this.logMode = this.yAxis.get('logMode');
      this.autoscalePadding = this.yAxis.get('autoscalePadding');
      const range = this.yAxis.get('range');
      if (range && range.min !== undefined && range.max !== undefined) {
        this.rangeMin = range.min;
        this.rangeMax = range.max;
      }
    },
    getPrefix() {
      let prefix = 'yAxis';
      if (this.isAdditionalYAxis) {
        let index = -1;
        if (this.domainObject?.configuration?.additionalYAxes) {
          index = this.domainObject?.configuration?.additionalYAxes.findIndex((yAxis) => {
            return yAxis.id === this.id;
          });
        }

        if (index < 0) {
          index = 0;
        }

        prefix = `additionalYAxes[${index}]`;
      }

      return prefix;
    },
    updateForm(formKey) {
      let newVal;
      if (formKey === 'range') {
        newVal = {
          min: this.rangeMin,
          max: this.rangeMax
        };
      } else {
        newVal = this[formKey];
      }

      let oldVal = this.yAxis.get(formKey);
      const formField = this.fields[formKey];

      const validationError = formField.validate?.(newVal, this.yAxis);
      this.validationErrors[formKey] = validationError;
      if (validationError) {
        return;
      }

      newVal = formField.coerce?.(newVal) ?? newVal;
      oldVal = formField.coerce?.(oldVal) ?? oldVal;

      const path = objectPath(formField.objectPath);
      if (!_.isEqual(newVal, oldVal)) {
        // We mutate the model for the plots first PlotConfigurationModel - this triggers changes that affects the plot behavior
        this.yAxis.set(formKey, newVal);
        // Then we mutate the domain object configuration to persist the settings
        if (path) {
          if (this.isAdditionalYAxis) {
            if (this.domainObject.configuration && this.domainObject.configuration.series) {
              //update the id
              this.openmct.objects.mutate(
                this.domainObject,
                `configuration.${this.getPrefix()}.id`,
                this.id
              );
              //update the yAxes values
              this.openmct.objects.mutate(
                this.domainObject,
                path(this.domainObject, this.yAxis),
                newVal
              );
            } else {
              this.$emit('seriesUpdated', {
                identifier: this.domainObject.identifier,
                path: `${this.getPrefix()}.${formKey}`,
                id: this.id,
                value: newVal
              });
            }
          } else {
            if (this.domainObject.configuration && this.domainObject.configuration.series) {
              this.openmct.objects.mutate(
                this.domainObject,
                path(this.domainObject, this.yAxis),
                newVal
              );
            } else {
              this.$emit('seriesUpdated', {
                identifier: this.domainObject.identifier,
                path: `${this.getPrefix()}.${formKey}`,
                value: newVal
              });
            }
          }

          //If autoscale is turned off, we must know what the user defined min and max ranges are
          if (formKey === 'autoscale' && this.autoscale === false) {
            const rangeFormField = this.fields.range;
            this.validationErrors.range = rangeFormField.validate?.(
              {
                min: this.rangeMin,
                max: this.rangeMax
              },
              this.yAxis
            );
          }
        }
      }
    }
  }
};
</script>
