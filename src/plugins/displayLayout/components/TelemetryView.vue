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
  <layout-frame
    :item="item"
    :grid-size="gridSize"
    :is-editing="isEditing"
    @move="(gridDelta) => $emit('move', gridDelta)"
    @endMove="() => $emit('endMove')"
  >
    <div
      v-if="domainObject"
      ref="telemetryViewWrapper"
      class="c-telemetry-view u-style-receiver"
      :class="[itemClasses]"
      :style="styleObject"
      :data-font-size="item.fontSize"
      :data-font="item.font"
      @contextmenu.prevent="showContextMenu"
      @mouseover.ctrl="showToolTip"
      @mouseleave="hideToolTip"
    >
      <div class="is-status__indicator" :title="`This item is ${status}`"></div>
      <div v-if="showLabel" class="c-telemetry-view__label">
        <div class="c-telemetry-view__label-text">
          {{ domainObject.name }}
        </div>
      </div>

      <div
        v-if="showValue"
        :title="fieldName"
        class="c-telemetry-view__value"
        :class="[telemetryClass]"
      >
        <div class="c-telemetry-view__value-text">
          {{ telemetryValue }}
          <span v-if="unit && item.showUnits" class="c-telemetry-view__value-text__unit">
            {{ unit }}
          </span>
        </div>
      </div>
    </div>
  </layout-frame>
</template>

<script>
import LayoutFrame from './LayoutFrame.vue';
import conditionalStylesMixin from '../mixins/objectStyles-mixin';
import stalenessMixin from '@/ui/mixins/staleness-mixin';
import {
  getDefaultNotebook,
  getNotebookSectionAndPage
} from '@/plugins/notebook/utils/notebook-storage.js';
import tooltipHelpers from '../../../api/tooltips/tooltipMixins';

const DEFAULT_TELEMETRY_DIMENSIONS = [10, 5];
const DEFAULT_POSITION = [1, 1];
const CONTEXT_MENU_ACTIONS = ['copyToClipboard', 'copyToNotebook', 'viewHistoricalData'];

export default {
  makeDefinition(openmct, gridSize, domainObject, position) {
    let metadata = openmct.telemetry.getMetadata(domainObject);
    position = position || DEFAULT_POSITION;

    return {
      identifier: domainObject.identifier,
      x: position[0],
      y: position[1],
      width: DEFAULT_TELEMETRY_DIMENSIONS[0],
      height: DEFAULT_TELEMETRY_DIMENSIONS[1],
      displayMode: 'all',
      value: metadata.getDefaultDisplayValue()?.key,
      stroke: '',
      fill: '',
      color: '',
      fontSize: 'default',
      font: 'default'
    };
  },
  components: {
    LayoutFrame
  },
  mixins: [conditionalStylesMixin, stalenessMixin, tooltipHelpers],
  inject: ['openmct', 'objectPath', 'currentView'],
  props: {
    item: {
      type: Object,
      required: true
    },
    gridSize: {
      type: Array,
      required: true,
      validator: (arr) => arr && arr.length === 2 && arr.every((el) => typeof el === 'number')
    },
    initSelect: Boolean,
    index: {
      type: Number,
      required: true
    },
    isEditing: {
      type: Boolean,
      required: true
    }
  },
  data() {
    return {
      currentObjectPath: undefined,
      datum: undefined,
      domainObject: undefined,
      formats: undefined,
      viewKey: `alphanumeric-format-${Math.random()}`,
      status: '',
      mutablePromise: undefined
    };
  },
  computed: {
    itemClasses() {
      let classes = [];

      if (this.status) {
        classes.push(`is-status--${this.status}`);
      }

      if (this.isStale) {
        classes.push('is-stale');
      }

      return classes;
    },
    showLabel() {
      let displayMode = this.item.displayMode;

      return displayMode === 'all' || displayMode === 'label';
    },
    showValue() {
      let displayMode = this.item.displayMode;

      return displayMode === 'all' || displayMode === 'value';
    },
    unit() {
      let value = this.item.value;
      let unit = this.metadata ? this.metadata.value(value).unit : '';

      return unit;
    },
    styleObject() {
      let size;
      //for legacy size support
      if (!this.item.fontSize) {
        size = this.item.size;
      }

      return Object.assign(
        {},
        {
          size
        },
        this.itemStyle
      );
    },
    fieldName() {
      return this.valueMetadata && this.valueMetadata.name;
    },
    valueMetadata() {
      return this.datum && this.metadata.value(this.item.value);
    },
    formatter() {
      if (this.item.format) {
        return this.customStringformatter;
      }

      return this.formats[this.item.value];
    },
    telemetryValue() {
      if (!this.datum) {
        return '---';
      }

      return this.formatter && this.formatter.format(this.datum);
    },
    telemetryClass() {
      if (!this.datum) {
        return;
      }

      let alarm =
        this.limitEvaluator && this.limitEvaluator.evaluate(this.datum, this.valueMetadata);

      return alarm && alarm.cssClass;
    }
  },
  watch: {
    index(newIndex) {
      if (!this.context) {
        return;
      }

      this.context.index = newIndex;
    },
    item(newItem) {
      if (!this.context) {
        return;
      }

      this.context.layoutItem = newItem;
    }
  },
  mounted() {
    if (this.openmct.objects.supportsMutation(this.item.identifier)) {
      this.mutablePromise = this.openmct.objects
        .getMutable(this.item.identifier)
        .then(this.setObject);
    } else {
      this.openmct.objects.get(this.item.identifier).then(this.setObject);
    }

    this.status = this.openmct.status.get(this.item.identifier);
    this.removeStatusListener = this.openmct.status.observe(this.item.identifier, this.setStatus);
  },
  beforeUnmount() {
    this.removeStatusListener();

    if (this.removeSelectable) {
      this.removeSelectable();
    }

    if (this.telemetryCollection) {
      this.telemetryCollection.off('add', this.setLatestValues);
      this.telemetryCollection.off('clear', this.refreshData);

      this.telemetryCollection.destroy();
    }

    if (this.mutablePromise) {
      this.mutablePromise.then(() => {
        this.openmct.objects.destroyMutable(this.domainObject);
      });
    } else if (this?.domainObject?.isMutable) {
      this.openmct.objects.destroyMutable(this.domainObject);
    }
  },
  methods: {
    formattedValueForCopy() {
      const timeFormatterKey = this.openmct.time.timeSystem().key;
      const timeFormatter = this.formats[timeFormatterKey];
      const unit = this.unit ? ` ${this.unit}` : '';

      return `At ${timeFormatter.format(this.datum)} ${this.domainObject.name} had a value of ${
        this.telemetryValue
      }${unit}`;
    },
    setLatestValues(data) {
      this.latestDatum = data[data.length - 1];
      this.updateView();
    },
    updateView() {
      if (!this.updatingView) {
        this.updatingView = true;
        requestAnimationFrame(() => {
          this.datum = this.latestDatum;
          this.updatingView = false;
        });
      }
    },
    refreshData(bounds, isTick) {
      if (!isTick) {
        this.latestDatum = undefined;
        this.updateView();
      }
    },
    setObject(domainObject) {
      this.domainObject = domainObject;
      this.mutablePromise = undefined;
      this.keyString = this.openmct.objects.makeKeyString(domainObject.identifier);
      this.metadata = this.openmct.telemetry.getMetadata(this.domainObject);
      this.limitEvaluator = this.openmct.telemetry.limitEvaluator(this.domainObject);
      this.formats = this.openmct.telemetry.getFormatMap(this.metadata);

      this.timeContext = this.openmct.time.getContextForView(this.objectPath);

      const valueMetadata = this.metadata ? this.metadata.value(this.item.value) : {};
      this.customStringformatter = this.openmct.telemetry.customStringFormatter(
        valueMetadata,
        this.item.format
      );

      this.telemetryCollection = this.openmct.telemetry.requestCollection(this.domainObject, {
        size: 1,
        strategy: 'latest',
        timeContext: this.timeContext
      });
      this.telemetryCollection.on('add', this.setLatestValues);
      this.telemetryCollection.on('clear', this.refreshData);
      this.telemetryCollection.load();

      this.currentObjectPath = this.objectPath.slice();
      this.currentObjectPath.unshift(this.domainObject);

      this.context = {
        item: domainObject,
        layoutItem: this.item,
        index: this.index,
        updateTelemetryFormat: this.updateTelemetryFormat,
        toggleUnits: this.toggleUnits,
        showUnits: this.showUnits
      };
      this.removeSelectable = this.openmct.selection.selectable(
        this.$el,
        this.context,
        this.immediatelySelect || this.initSelect
      );
      delete this.immediatelySelect;
      this.subscribeToStaleness(this.domainObject);
    },
    updateTelemetryFormat(format) {
      this.customStringformatter.setFormat(format);

      this.$emit('formatChanged', this.item, format);
    },
    updateViewContext() {
      this.$emit('contextClick', {
        viewHistoricalData: true,
        formattedValueForCopy: this.formattedValueForCopy
      });
    },
    async getContextMenuActions() {
      const defaultNotebook = getDefaultNotebook();

      let defaultNotebookName;
      if (defaultNotebook) {
        const domainObject = await this.openmct.objects.get(defaultNotebook.identifier);
        const { section, page } = getNotebookSectionAndPage(
          domainObject,
          defaultNotebook.defaultSectionId,
          defaultNotebook.defaultPageId
        );
        if (section && page) {
          const defaultPath =
            domainObject && `${domainObject.name} - ${section.name} - ${page.name}`;
          defaultNotebookName = `Copy to Notebook ${defaultPath}`;
        }
      }

      return CONTEXT_MENU_ACTIONS.map((actionKey) => {
        const action = this.openmct.actions.getAction(actionKey);
        if (action.key === 'copyToNotebook') {
          action.name = defaultNotebookName;
        }

        return action;
      }).filter((action) => action.name !== undefined);
    },
    async showContextMenu(event) {
      this.updateViewContext();
      const contextMenuActions = await this.getContextMenuActions();
      const menuItems = this.openmct.menus.actionsToMenuItems(
        contextMenuActions,
        this.currentObjectPath,
        this.currentView
      );
      this.openmct.menus.showMenu(event.x, event.y, menuItems);
    },
    setStatus(status) {
      this.status = status;
    },
    async showToolTip() {
      const { BELOW } = this.openmct.tooltips.TOOLTIP_LOCATIONS;
      this.buildToolTip(await this.getObjectPath(), BELOW, 'telemetryViewWrapper');
    }
  }
};
</script>
