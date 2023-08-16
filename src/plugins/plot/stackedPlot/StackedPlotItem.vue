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
import conditionalStylesMixin from './mixins/objectStyles-mixin';
import stalenessMixin from '@/ui/mixins/staleness-mixin';
import StalenessUtils from '@/utils/staleness';
import configStore from '@/plugins/plot/configuration/ConfigStore';
import PlotConfigurationModel from '@/plugins/plot/configuration/PlotConfigurationModel';
import Plot from '../Plot.vue';

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
        this.isStale = this.staleObjects.length > 0;
        this.updateComponentProp('isStale', this.isStale);
      },
      deep: true
    }
  },
  mounted() {
    this.stalenessSubscription = {};
    this.updateView();
    this.isEditing = this.openmct.editor.isEditing();
    this.openmct.editor.on('isEditing', this.setEditState);
  },
  beforeUnmount() {
    this.openmct.editor.off('isEditing', this.setEditState);

    if (this.removeSelectable) {
      this.removeSelectable();
    }

    if (this._destroy) {
      this._destroy();
    }

    this.destroyStalenessListeners();
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
      this.isStale = false;

      this.destroyStalenessListeners();

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
        this.subscribeToStaleness(object, (isStale) => {
          this.updateComponentProp('isStale', isStale);
        });
      } else {
        // possibly overlay or other composition based plot
        this.composition = this.openmct.composition.get(object);

        this.composition.on('add', this.watchStaleness);
        this.composition.on('remove', this.unwatchStaleness);
        this.composition.load();
      }

      const { vNode } = mount(
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
                      @loadingUpdated="loadingUpdated"
                      @configLoaded="onConfigLoaded"
                      @lockHighlightPoint="onLockHighlightPointUpdated"
                      @highlights="onHighlightsUpdated"
                      @plotYTickWidth="onYTickWidthChange"
                      @cursorGuide="onCursorGuideChange"
                      @gridLines="onGridLinesChange"/>`
        },
        {
          app: this.openmct.app,
          element: this.$el
        }
      );
      this.component = vNode.componentInstance;

      if (this.isEditing) {
        this.setSelection();
      }
    },
    watchStaleness(domainObject) {
      const keyString = this.openmct.objects.makeKeyString(domainObject.identifier);
      this.stalenessSubscription[keyString] = {};
      this.stalenessSubscription[keyString].stalenessUtils = new StalenessUtils(
        this.openmct,
        domainObject
      );

      this.openmct.telemetry.isStale(domainObject).then((stalenessResponse) => {
        if (stalenessResponse !== undefined) {
          this.handleStaleness(keyString, stalenessResponse);
        }
      });
      const stalenessSubscription = this.openmct.telemetry.subscribeToStaleness(
        domainObject,
        (stalenessResponse) => {
          this.handleStaleness(keyString, stalenessResponse);
        }
      );

      this.stalenessSubscription[keyString].unsubscribe = stalenessSubscription;
    },
    unwatchStaleness(domainObject) {
      const SKIP_CHECK = true;
      const keyString = this.openmct.objects.makeKeyString(domainObject.identifier);

      this.stalenessSubscription[keyString].unsubscribe();
      this.stalenessSubscription[keyString].stalenessUtils.destroy();
      this.handleStaleness(keyString, { isStale: false }, SKIP_CHECK);

      delete this.stalenessSubscription[keyString];
    },
    handleStaleness(keyString, stalenessResponse, skipCheck = false) {
      if (
        skipCheck ||
        this.stalenessSubscription[keyString].stalenessUtils.shouldUpdateStaleness(
          stalenessResponse
        )
      ) {
        const index = this.staleObjects.indexOf(keyString);
        const foundStaleObject = index > -1;
        if (stalenessResponse.isStale && !foundStaleObject) {
          this.staleObjects.push(keyString);
        } else if (!stalenessResponse.isStale && foundStaleObject) {
          this.staleObjects.splice(index, 1);
        }
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
    },
    destroyStalenessListeners() {
      this.triggerUnsubscribeFromStaleness();

      if (this.composition) {
        this.composition.off('add', this.watchStaleness);
        this.composition.off('remove', this.unwatchStaleness);
        this.composition = null;
      }

      Object.values(this.stalenessSubscription).forEach((stalenessSubscription) => {
        stalenessSubscription.unsubscribe();
        stalenessSubscription.stalenessUtils.destroy();
      });
    }
  }
};
</script>
