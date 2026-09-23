<!--
 Open MCT, Copyright (c) 2014-2026, United States Government
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
  <div
    ref="pieChartWrapper"
    class="c-pie-chart__wrapper js-pie-chart-wrapper"
    :class="pieChartClasses"
  >
    <svg
      ref="pieChart"
      class="c-pie-chart"
      viewBox="0 0 10 10"
      role="img"
      :aria-label="pieChartLabel"
    >
      <g class="c-pie-chart__graphics" :transform="graphicsTransform">
        <circle
          class="c-pie-chart__bg"
          cx="5"
          cy="5"
          :r="radius"
          fill="none"
          :stroke-width="strokeWidth"
          :stroke-dasharray="dashArray(sweepDegrees)"
        />
        <circle
          v-for="wedge in wedgeSegments"
          :key="wedge.key"
          class="c-pie-chart__wedge"
          :class="{ 'is-highlighted': wedge.key === highlightedKey }"
          cx="5"
          cy="5"
          :r="radius"
          fill="none"
          :stroke-width="strokeWidth"
          :stroke-dasharray="dashArray(wedge.endAngle - wedge.startAngle)"
          :stroke-dashoffset="dashOffset(wedge.startAngle)"
        />
      </g>

      <text
        v-for="label in wedgeLabels"
        :key="label.key"
        class="c-pie-chart__wedge-label"
        :x="label.x"
        :y="label.y"
        text-anchor="middle"
        dominant-baseline="middle"
        font-size="0.6"
      >
        {{ label.value }}
      </text>

      <svg
        v-if="isOverTarget"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 512 512"
        xml:space="preserve"
        class="c-pie-chart__value-oor-indicator"
        x="45%"
        y="5%"
        width="1"
        height="1"
      >
        <path
          d="M448 0H64C28.7.1.1 28.7 0 64v384c.1 35.3 28.7 63.9 64 64h384c35.3-.1 63.9-28.7 64-64V64c-.1-35.3-28.7-63.9-64-64zM288 448h-64v-64h64v64zm10.9-192L280 352h-48l-18.9-96V64H299v192h-.1z"
        />
      </svg>
    </svg>
  </div>
</template>

<script>
import stalenessMixin from '@/ui/mixins/staleness-mixin';

import tooltipHelpers from '../../../api/tooltips/tooltipMixins.js';
import { getRemainingValue, getWedgeSegments, isOvershoot } from '../pie-chart-angle-util.js';
import { PIE_CHART_SWEEP_DEGREES } from '../PieChartConstants.js';

const RADIUS = 4;
const STROKE_WIDTH = 1;
const MIN_ANGLE_FOR_LABEL = 8;
const PIE_CHART_CENTER = 5;
// Full circle starts its sweep at the top (12 o'clock) and goes clockwise.
// Semicircle starts at 9 o'clock so its sweep covers the top half only
// (a horizontal split), rather than rotating -90 which would split the
// circle vertically and use the right half.
const GRAPHICS_ROTATION_DEGREES = {
  'full-circle': -90,
  semicircle: 180
};

export default {
  mixins: [stalenessMixin, tooltipHelpers],
  inject: ['openmct', 'domainObject', 'composition', 'renderWhenVisible'],
  data() {
    const pieChartController = this.domainObject.configuration.pieChartController;

    return {
      wedges: [],
      target: pieChartController.target,
      shape: pieChartController.shape,
      highlightedKey: pieChartController.highlightedKey,
      radius: RADIUS,
      strokeWidth: STROKE_WIDTH
    };
  },
  computed: {
    sweepDegrees() {
      return PIE_CHART_SWEEP_DEGREES[this.shape];
    },
    graphicsRotationDegrees() {
      return GRAPHICS_ROTATION_DEGREES[this.shape];
    },
    graphicsTransform() {
      return `rotate(${this.graphicsRotationDegrees} 5 5)`;
    },
    circumference() {
      return 2 * Math.PI * this.radius;
    },
    remaining() {
      return getRemainingValue(this.wedges, this.target);
    },
    isOverTarget() {
      return isOvershoot(this.wedges, this.target);
    },
    wedgeSegments() {
      const allWedges = this.wedges.concat([
        { key: '__remaining__', name: 'Remaining', value: this.remaining }
      ]);

      return getWedgeSegments(allWedges, this.target, this.sweepDegrees);
    },
    pieChartClasses() {
      let classes = [`c-pie-chart--${this.shape}`];

      if (this.isStale) {
        classes.push('is-stale');
      }

      return classes;
    },
    pieChartLabel() {
      return this.wedges.map((wedge) => `${wedge.name}: ${wedge.value}`).join(', ');
    },
    // Labels are rendered as siblings of the rotated <g>, so the group's
    // rotate(-90) transform is applied manually to keep label position
    // in sync with its wedge.
    wedgeLabels() {
      return this.wedgeSegments
        .filter(
          (wedge) =>
            wedge.key !== '__remaining__' &&
            wedge.endAngle - wedge.startAngle >= MIN_ANGLE_FOR_LABEL
        )
        .map((wedge) => {
          const midAngleDeg =
            (wedge.startAngle + wedge.endAngle) / 2 + this.graphicsRotationDegrees;
          const midAngleRad = (midAngleDeg * Math.PI) / 180;

          return {
            key: wedge.key,
            value: wedge.value,
            x: PIE_CHART_CENTER + this.radius * Math.cos(midAngleRad),
            y: PIE_CHART_CENTER + this.radius * Math.sin(midAngleRad)
          };
        });
    }
  },
  mounted() {
    this.composition.on('add', this.addedToComposition);
    this.composition.on('remove', this.removeTelemetryObject);

    this.composition.load();

    this.openmct.time.on('boundsChanged', this.refreshData);

    this.unobserveController = this.openmct.objects.observe(
      this.domainObject,
      'configuration.pieChartController',
      this.setPieChartController
    );

    this.setupClockChangedEvent((domainObject) => {
      this.triggerUnsubscribeFromStaleness(domainObject);
      this.subscribeToStaleness(domainObject);
    });
  },
  unmounted() {
    this.composition.off('add', this.addedToComposition);
    this.composition.off('remove', this.removeTelemetryObject);

    if (this.unsubscribe) {
      this.unsubscribe();
    }

    if (this.unobserveController) {
      this.unobserveController();
    }

    this.openmct.time.off('boundsChanged', this.refreshData);
  },
  methods: {
    setPieChartController(pieChartController) {
      this.target = pieChartController.target;
      this.shape = pieChartController.shape;
      this.highlightedKey = pieChartController.highlightedKey;
    },
    addTelemetryObjectAndSubscribe(domainObject) {
      this.telemetryObject = domainObject;
      this.request();
      this.subscribe();

      this.subscribeToStaleness(domainObject);
    },
    addedToComposition(domainObject) {
      if (this.telemetryObject) {
        this.confirmRemoval(domainObject);
      } else {
        this.addTelemetryObjectAndSubscribe(domainObject);
      }
    },
    confirmRemoval(domainObject) {
      const dialog = this.openmct.overlays.dialog({
        iconClass: 'alert',
        message: 'This action will replace the current telemetry source. Do you want to continue?',
        buttons: [
          {
            label: 'Ok',
            emphasis: true,
            callback: () => {
              this.removeFromComposition();
              this.removeTelemetryObject();
              this.addTelemetryObjectAndSubscribe(domainObject);
              dialog.dismiss();
            }
          },
          {
            label: 'Cancel',
            callback: () => {
              this.removeFromComposition(domainObject);
              dialog.dismiss();
            }
          }
        ]
      });
    },
    removeFromComposition(telemetryObject = this.telemetryObject) {
      this.composition.remove(telemetryObject);
    },
    removeTelemetryObject() {
      if (this.unsubscribe) {
        this.unsubscribe();
        this.unsubscribe = null;
      }

      this.triggerUnsubscribeFromStaleness(this.domainObject);

      this.telemetryObject = null;
      this.metadata = null;
      this.formats = null;
      this.wedgeKeys = [];
      this.wedges = [];
    },
    refreshData(bounds, isTick) {
      if (!isTick) {
        this.request();
      }
    },
    // Own-copy extraction of scalar range-hinted values from telemetry metadata,
    // ordered ascending by hints.range (mirrors BarGraphView.vue's non-array
    // getAxisMetadata()/addDataToGraph() pattern; not shared, see design doc item 10).
    getWedgeMetadata(metadata) {
      return metadata
        .valuesForHints(['range'])
        .filter((valueMetadata) => !metadata.isArrayValue(valueMetadata));
    },
    extractWedgesFromDatum(datum) {
      return this.wedgeKeys.map((valueMetadata) => {
        const formatter = this.formats[valueMetadata.key];
        const rawValue = formatter ? formatter.format(datum) : datum[valueMetadata.key];

        return {
          key: valueMetadata.key,
          name: valueMetadata.name || valueMetadata.key,
          value: Number(rawValue) || 0
        };
      });
    },
    request(domainObject = this.telemetryObject) {
      this.metadata = this.openmct.telemetry.getMetadata(domainObject);

      if (!this.metadata) {
        return;
      }

      this.formats = this.openmct.telemetry.getFormatMap(this.metadata);
      this.wedgeKeys = this.getWedgeMetadata(this.metadata);

      const options = {
        strategy: 'latest',
        timeContext: this.openmct.time.getContextForView([])
      };
      this.openmct.telemetry.request(domainObject, options).then((values) => {
        const length = values.length;
        if (length > 0) {
          this.updateValue(values[length - 1]);
        }
      });
    },
    subscribe(domainObject = this.telemetryObject) {
      this.unsubscribe = this.openmct.telemetry.subscribe(
        domainObject,
        this.updateValue.bind(this)
      );
    },
    updateValue(datum) {
      this.datum = datum;

      if (this.isRendering) {
        return;
      }

      this.isRendering = this.renderWhenVisible(() => {
        this.isRendering = false;

        this.wedges = this.extractWedgesFromDatum(this.datum);
      });
    },
    dashArray(angle) {
      const arcLength = this.circumference * (angle / 360);

      return `${arcLength} ${this.circumference - arcLength}`;
    },
    dashOffset(startAngle) {
      return -(this.circumference * (startAngle / 360));
    },
    async showToolTip() {
      const { CENTER } = this.openmct.tooltips.TOOLTIP_LOCATIONS;
      this.buildToolTip(await this.getTelemetryPathString(), CENTER, 'pie-chart');
    }
  }
};
</script>
