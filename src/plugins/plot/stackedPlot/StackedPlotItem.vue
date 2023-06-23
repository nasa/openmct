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
  <div :aria-label="`Stacked Plot Item ${childObject.name}`"></div>
</template>
<script>
import Vue from 'vue';
import conditionalStylesMixin from './mixins/objectStyles-mixin';
import configStore from '@/plugins/plot/configuration/ConfigStore';
import PlotConfigurationModel from '@/plugins/plot/configuration/PlotConfigurationModel';
import Plot from '../Plot.vue';

export default {
  mixins: [conditionalStylesMixin],
  inject: ['openmct', 'domainObject', 'path'],
  props: {
    childObject: {
      type: Object,
      default() {
        return {};
      }
    },
    options: {
      type: Object,
      default() {
        return {};
      }
    },
    gridLines: {
      type: Boolean,
      default() {
        return true;
      }
    },
    cursorGuide: {
      type: Boolean,
      default() {
        return true;
      }
    },
    showLimitLineLabels: {
      type: Object,
      default() {
        return undefined;
      }
    },
    colorPalette: {
      type: Object,
      default() {
        return undefined;
      }
    },
    parentYTickWidth: {
      type: Object,
      default() {
        return {
          leftTickWidth: 0,
          rightTickWidth: 0,
          hasMultipleLeftAxes: false
        };
      }
    },
    hideLegend: {
      type: Boolean,
      default() {
        return false;
      }
    }
  },
  watch: {
    gridLines(newGridLines) {
      this.updateComponentProp('gridLines', newGridLines);
    },
    cursorGuide(newCursorGuide) {
      this.updateComponentProp('cursorGuide', newCursorGuide);
    },
    parentYTickWidth(width) {
      this.updateComponentProp('parentYTickWidth', width);
    },
    showLimitLineLabels: {
      handler(data) {
        this.updateComponentProp('limitLineLabels', data);
      },
      deep: true
    },
    hideLegend(newHideLegend) {
      this.updateComponentProp('hideLegend', newHideLegend);
    }
  },
  mounted() {
    this.updateView();
    this.isEditing = this.openmct.editor.isEditing();
    this.openmct.editor.on('isEditing', this.setEditState);
  },
  beforeDestroy() {
    this.openmct.editor.off('isEditing', this.setEditState);

    if (this.removeSelectable) {
      this.removeSelectable();
    }

    if (this.component) {
      this.component.$destroy();
    }
  },
  methods: {
    setEditState(isEditing) {
      this.isEditing = isEditing;

      if (this.isEditing) {
        this.setSelection();
      } else {
        if (this.removeSelectable) {
          this.removeSelectable();
        }
      }
    },

    updateComponentProp(prop, value) {
      if (this.component) {
        this.component[prop] = value;
      }
    },
    updateView() {
      if (this.component) {
        this.component.$destroy();
        this.component = null;
        this.$el.innerHTML = '';
      }

      const onYTickWidthChange = this.onYTickWidthChange;
      const onLockHighlightPointUpdated = this.onLockHighlightPointUpdated;
      const onHighlightsUpdated = this.onHighlightsUpdated;
      const onConfigLoaded = this.onConfigLoaded;
      const onCursorGuideChange = this.onCursorGuideChange;
      const onGridLinesChange = this.onGridLinesChange;

      const openmct = this.openmct;
      const path = this.path;

      //If this object is not persistable, then package it with it's parent
      const object = this.getPlotObject();

      const getProps = this.getProps;
      const isMissing = openmct.objects.isMissing(object);
      let viewContainer = document.createElement('div');
      this.$el.append(viewContainer);
      this.component = new Vue({
        el: viewContainer,
        components: {
          Plot
        },
        provide: {
          openmct,
          domainObject: object,
          path
        },
        data() {
          return {
            ...getProps(),
            onYTickWidthChange,
            onLockHighlightPointUpdated,
            onHighlightsUpdated,
            onConfigLoaded,
            onCursorGuideChange,
            onGridLinesChange,
            isMissing,
            loading: false
          };
        },
        methods: {
          loadingUpdated(loaded) {
            this.loading = loaded;
          }
        },
        template: `
                  <Plot ref="plotComponent" v-if="!isMissing"
                      :init-grid-lines="gridLines"
                      :hide-legend="hideLegend"
                      :init-cursor-guide="cursorGuide"
                      :parent-limit-line-labels="limitLineLabels"
                      :options="options"
                      :parent-y-tick-width="parentYTickWidth"
                      :color-palette="colorPalette"
                      @loadingUpdated="loadingUpdated"
                      @configLoaded="onConfigLoaded"
                      @lockHighlightPoint="onLockHighlightPointUpdated"
                      @highlights="onHighlightsUpdated"
                      @plotYTickWidth="onYTickWidthChange"
                      @cursorGuide="onCursorGuideChange"
                      @gridLines="onGridLinesChange"/>`
      });

      if (this.isEditing) {
        this.setSelection();
      }
    },
    onLockHighlightPointUpdated() {
      this.$emit('lockHighlightPoint', ...arguments);
    },
    onHighlightsUpdated() {
      this.$emit('highlights', ...arguments);
    },
    onConfigLoaded() {
      this.$emit('configLoaded', ...arguments);
    },
    onYTickWidthChange() {
      this.$emit('plotYTickWidth', ...arguments);
    },
    onCursorGuideChange() {
      this.$emit('cursorGuide', ...arguments);
    },
    onGridLinesChange() {
      this.$emit('gridLines', ...arguments);
    },
    setSelection() {
      let childContext = {};
      childContext.item = this.childObject;
      this.context = childContext;
      if (this.removeSelectable) {
        this.removeSelectable();
      }

      this.removeSelectable = this.openmct.selection.selectable(this.$el, this.context);
    },
    getProps() {
      return {
        hideLegend: this.hideLegend,
        limitLineLabels: this.showLimitLineLabels,
        gridLines: this.gridLines,
        cursorGuide: this.cursorGuide,
        parentYTickWidth: this.parentYTickWidth,
        options: this.options,
        colorPalette: this.colorPalette
      };
    },
    getPlotObject() {
      if (this.childObject.configuration && this.childObject.configuration.series) {
        //If the object has a configuration (like an overlay plot), allow initialization of the config from it's persisted config
        return this.childObject;
      } else {
        //If object is missing, warn and return object
        if (this.openmct.objects.isMissing(this.childObject)) {
          console.warn('Missing domain object');

          return this.childObject;
        }

        // If the object does not have configuration, initialize the series config with the persisted config from the stacked plot
        const configId = this.openmct.objects.makeKeyString(this.childObject.identifier);
        let config = configStore.get(configId);
        if (!config) {
          let persistedSeriesConfig = this.domainObject.configuration.series.find(
            (seriesConfig) => {
              return this.openmct.objects.areIdsEqual(
                seriesConfig.identifier,
                this.childObject.identifier
              );
            }
          );

          if (!persistedSeriesConfig) {
            persistedSeriesConfig = {
              series: {},
              yAxis: {}
            };
          }

          config = new PlotConfigurationModel({
            id: configId,
            domainObject: {
              ...this.childObject,
              configuration: {
                series: [
                  {
                    identifier: this.childObject.identifier,
                    ...persistedSeriesConfig.series
                  }
                ],
                yAxis: persistedSeriesConfig.yAxis
              }
            },
            openmct: this.openmct,
            palette: this.colorPalette,
            callback: (data) => {
              this.data = data;
            }
          });
          configStore.add(configId, config);
        }

        return this.childObject;
      }
    }
  }
};
</script>
