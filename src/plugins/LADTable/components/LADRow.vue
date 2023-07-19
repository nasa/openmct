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
  <tr
    class="js-lad-table__body__row c-table__selectable-row"
    @click="clickedRow"
    @contextmenu.prevent="showContextMenu"
  >
    <td
      ref="tableCell"
      class="js-first-data"
      @mouseover.ctrl="showToolTip"
      @mouseleave="hideToolTip"
    >
      {{ domainObject.name }}
    </td>
    <td v-if="showTimestamp" class="js-second-data">{{ formattedTimestamp }}</td>
    <td class="js-third-data" :class="valueClasses">{{ value }}</td>
    <td v-if="hasUnits" class="js-units">
      {{ unit }}
    </td>
    <td v-if="showType" class="js-type-data">{{ typeLabel }}</td>
  </tr>
</template>

<script>
const CONTEXT_MENU_ACTIONS = ['viewDatumAction', 'viewHistoricalData', 'remove'];
const BLANK_VALUE = '---';

import identifierToString from '/src/tools/url';
import PreviewAction from '@/ui/preview/PreviewAction.js';
import tooltipHelpers from '../../../api/tooltips/tooltipMixins';

export default {
  mixins: [tooltipHelpers],
  inject: ['openmct', 'currentView'],
  props: {
    domainObject: {
      type: Object,
      required: true
    },
    pathToTable: {
      type: Array,
      required: true
    },
    hasUnits: {
      type: Boolean,
      requred: true
    },
    isStale: {
      type: Boolean,
      default() {
        return false;
      }
    },
    configuration: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      datum: undefined,
      timestamp: undefined,
      timestampKey: undefined,
      composition: [],
      unit: ''
    };
  },
  computed: {
    value() {
      if (!this.datum || this.isAggregate) {
        return BLANK_VALUE;
      }

      return this.formats[this.valueKey].format(this.datum);
    },
    typeLabel() {
      if (this.isAggregate) {
        return 'Aggregate';
      }

      return 'Telemetry';
    },
    isAggregate() {
      return this.composition && this.composition.length > 0;
    },
    valueClasses() {
      let classes = [];

      if (this.isStale) {
        classes.push('is-stale');
      }

      if (this.datum) {
        const limit = this.limitEvaluator.evaluate(this.datum, this.valueMetadata);

        if (limit) {
          classes.push(limit.cssClass);
        }
      }

      return classes;
    },
    formattedTimestamp() {
      if (!this.timestamp || this.isAggregate) {
        return BLANK_VALUE;
      }

      return this.timeSystemFormat.format(this.timestamp);
    },
    timeSystemFormat() {
      if (!this.formats[this.timestampKey]) {
        console.warn(
          `No formatter for ${this.timestampKey} time system for ${this.domainObject.name}.`
        );
      }

      return this.formats[this.timestampKey];
    },
    objectPath() {
      return [this.domainObject, ...this.pathToTable];
    },
    showTimestamp() {
      return !this.configuration?.hiddenColumns?.timestamp;
    },
    showType() {
      return !this.configuration?.hiddenColumns?.type;
    }
  },
  async mounted() {
    this.metadata = this.openmct.telemetry.getMetadata(this.domainObject);
    this.formats = this.openmct.telemetry.getFormatMap(this.metadata);
    this.keyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);
    const compositionCollection = this.openmct.composition.get(this.domainObject);
    if (compositionCollection) {
      this.composition = await compositionCollection.load();
    }

    this.timeContext = this.openmct.time.getContextForView(this.objectPath);

    this.limitEvaluator = this.openmct.telemetry.limitEvaluator(this.domainObject);

    this.openmct.time.on('timeSystem', this.updateTimeSystem);

    this.timestampKey = this.openmct.time.timeSystem().key;

    this.valueMetadata = undefined;

    if (this.metadata) {
      this.valueMetadata =
        this.metadata.valuesForHints(['range'])[0] || this.firstNonDomainAttribute(this.metadata);
    }

    this.valueKey = this.valueMetadata ? this.valueMetadata.key : undefined;

    this.telemetryCollection = this.openmct.telemetry.requestCollection(this.domainObject, {
      size: 1,
      strategy: 'latest',
      timeContext: this.timeContext
    });
    this.telemetryCollection.on('add', this.setLatestValues);
    this.telemetryCollection.on('clear', this.resetValues);
    this.telemetryCollection.load();

    if (this.hasUnits) {
      this.setUnit();
    }

    this.previewAction = new PreviewAction(this.openmct);
    this.previewAction.on('isVisible', this.togglePreviewState);
  },
  unmounted() {
    this.openmct.time.off('timeSystem', this.updateTimeSystem);
    this.telemetryCollection.off('add', this.setLatestValues);
    this.telemetryCollection.off('clear', this.resetValues);
    this.previewAction.off('isVisible', this.togglePreviewState);

    this.telemetryCollection.destroy();
  },
  methods: {
    updateView() {
      if (!this.updatingView) {
        this.updatingView = true;
        requestAnimationFrame(() => {
          this.timestamp = this.getParsedTimestamp(this.latestDatum);
          this.datum = this.latestDatum;
          this.updatingView = false;
        });
      }
    },
    clickedRow(event) {
      if (this.openmct.editor.isEditing()) {
        event.preventDefault();
        this.preview(this.objectPath);
      } else {
        const resultUrl = identifierToString(this.openmct, this.objectPath);
        this.openmct.router.navigate(resultUrl);
      }
    },
    preview(objectPath) {
      if (this.previewAction.appliesTo(objectPath)) {
        this.previewAction.invoke(objectPath);
      }
    },
    setLatestValues(data) {
      this.latestDatum = data[data.length - 1];
      this.updateView();
    },
    updateTimeSystem(timeSystem) {
      this.timestampKey = timeSystem.key;
    },
    updateViewContext() {
      this.$emit('rowContextClick', {
        viewHistoricalData: true,
        viewDatumAction: true,
        getDatum: () => {
          return this.datum;
        }
      });
    },
    showContextMenu(event) {
      this.updateViewContext();

      const actions = CONTEXT_MENU_ACTIONS.map((key) => this.openmct.actions.getAction(key));
      const menuItems = this.openmct.menus.actionsToMenuItems(
        actions,
        this.objectPath,
        this.currentView
      );
      if (menuItems.length) {
        this.openmct.menus.showMenu(event.x, event.y, menuItems);
      }
    },
    resetValues() {
      this.timestamp = undefined;
      this.datum = undefined;
    },
    getParsedTimestamp(timestamp) {
      if (this.timeSystemFormat) {
        return this.timeSystemFormat.parse(timestamp);
      }
    },
    setUnit() {
      this.unit = this.valueMetadata ? this.valueMetadata.unit : '';
    },
    firstNonDomainAttribute(metadata) {
      return metadata
        .values()
        .find((metadatum) => metadatum.hints.domain === undefined && metadatum.key !== 'name');
    },
    async showToolTip() {
      const { BELOW } = this.openmct.tooltips.TOOLTIP_LOCATIONS;
      this.buildToolTip(await this.getObjectPath(), BELOW, 'tableCell');
    }
  }
};
</script>
