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
import mount from 'utils/mount';

import configStore from '@/plugins/plot/configuration/ConfigStore';
import PlotConfigurationModel from '@/plugins/plot/configuration/PlotConfigurationModel';
import stalenessMixin from '@/ui/mixins/staleness-mixin';

import Plot from '../PlotView.vue';
import conditionalStylesMixin from './mixins/objectStyles-mixin';

export default {
  mixins: [conditionalStylesMixin, stalenessMixin],
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
  emits: [
    'lock-highlight-point',
    'highlights',
    'config-loaded',
    'cursor-guide',
    'grid-lines',
    'plot-y-tick-width'
  ],
  data() {
    return {
      staleObjects: []
    };
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
    },
    staleObjects: {
      handler() {
        this.updateComponentProp('isStale', this.isStale);
      },
      deep: true
    }
  },
  mounted() {
    this.updateView();
    this.isEditing = this.openmct.editor.isEditing();
    this.openmct.editor.on('isEditing', this.setEditState);
    this.setupClockChangedEvent((domainObject) => {
      this.triggerUnsubscribeFromStaleness(domainObject);
      this.subscribeToStaleness(domainObject);
    });
  },
  beforeUnmount() {
    this.openmct.editor.off('isEditing', this.setEditState);
    if (this.composition) {
      this.composition.off('add', this.subscribeToStaleness);
      this.composition.off('remove', this.triggerUnsubscribeFromStaleness);
    }

    if (this.removeSelectable) {
      this.removeSelectable();
    }

    const configId = this.openmct.objects.makeKeyString(this.childObject.identifier);
    configStore.deleteStore(configId);

    if (this._destroy) {
      this._destroy();
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
      if (this._destroy) {
        this._destroy();
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

      if (this.openmct.telemetry.isTelemetryObject(object)) {
        this.subscribeToStaleness(object, (stalenessResponse) => {
          this.updateComponentProp('isStale', stalenessResponse.isStale);
        });
      } else {
        // possibly overlay or other composition based plot
        this.composition = this.openmct.composition.get(object);

        this.composition.on('add', this.subscribeToStaleness);
        this.composition.on('remove', this.triggerUnsubscribeFromStaleness);
        this.composition.load();
      }

      const { vNode, destroy } = mount(
        {
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
                      :class="{'is-stale': isStale}"
                      :grid-lines="gridLines"
                      :hide-legend="hideLegend"
                      :cursor-guide="cursorGuide"
                      :parent-limit-line-labels="limitLineLabels"
                      :options="options"
                      :parent-y-tick-width="parentYTickWidth"
                      :color-palette="colorPalette"
                      @loading-updated="loadingUpdated"
                      @config-loaded="onConfigLoaded"
                      @lock-highlight-point="onLockHighlightPointUpdated"
                      @highlights="onHighlightsUpdated"
                      @plot-y-tick-width="onYTickWidthChange"
                      @cursor-guide="onCursorGuideChange"
                      @grid-lines="onGridLinesChange"/>`
        },
        {
          app: this.openmct.app,
          element: this.$el
        }
      );
      this.component = vNode.componentInstance;
      this._destroy = destroy;

      if (this.isEditing) {
        this.setSelection();
      }
    },
    onLockHighlightPointUpdated() {
      this.$emit('lock-highlight-point', ...arguments);
    },
    onHighlightsUpdated() {
      this.$emit('highlights', ...arguments);
    },
    onConfigLoaded() {
      this.$emit('config-loaded', ...arguments);
    },
    onYTickWidthChange() {
      this.$emit('plot-y-tick-width', ...arguments);
    },
    onCursorGuideChange() {
      this.$emit('cursor-guide', ...arguments);
    },
    onGridLinesChange() {
      this.$emit('grid-lines', ...arguments);
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
        colorPalette: this.colorPalette,
        isStale: this.isStale
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
