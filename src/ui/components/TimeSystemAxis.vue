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
  <div ref="axisHolder" class="c-timesystem-axis">
    <div v-if="showAheadBehind" class="c-ta-abi" :class="aheadOrBehindCSSClass">
      <div class="c-ta-abi__icon icon-clock"></div>
      <div class="c-ta-abi__connector"></div>
      <div class="c-ta-abi__text">{{ formattedAheadBehindDuration }}</div>
    </div>
    <div ref="lineWrapper" class="c-timesystem-axis__line-wrapper" :style="lineWrapperStyle">
      <div
        ref="nowMarker"
        class="c-timesystem-axis__mb-line"
        :style="nowMarkerStyle"
        aria-label="Now Marker"
      >
        <div
          v-if="showAheadBehind"
          ref="aheadBehindMarker"
          class="c-timesystem-axis__ahead-behind-line"
          :class="aheadOrBehindCSSClass"
          :style="aheadBehindMarkerStyle"
          aria-label="Ahead Behind Marker"
        >
          <svg
            class="c-timesystem-axis__ahead-behind-connector"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            <polygon
              class="c-timesystem-axis__ahead-behind-connector--ahead"
              points="0 0 100 0 100 100"
            ></polygon>
            <polygon
              class="c-timesystem-axis__ahead-behind-connector--behind"
              points="0 0 100 0 0 100"
            ></polygon>
          </svg>
        </div>
      </div>
    </div>
    <svg class="c-timesystem-axis__ticks" :width="svgWidth" :height="svgHeight">
      <g class="axis" :transform="axisTransform"></g>
    </svg>
  </div>
</template>

<script>
const AXES_PADDING = 20;

import { axisTop } from 'd3-axis';
import { scaleLinear, scaleUtc } from 'd3-scale';
import { select } from 'd3-selection';
import { inject, onMounted, reactive, ref } from 'vue';

import utcMultiTimeFormat from '@/plugins/timeConductor/utcMultiTimeFormat';

import { getPreciseDuration } from '../../utils/duration';
import { useAlignment } from '../composables/alignmentContext';
import { useResizeObserver } from '../composables/resize';

const PADDING = 1;
const PIXELS_PER_TICK = 100;
const PIXELS_PER_TICK_WIDE = 200;
const TIME_AXIS_LINE_Y = 20;
const executionMonitorStates = [
  {
    key: 'nominal',
    label: 'Nominal'
  },
  {
    key: 'behind',
    label: 'Behind by'
  },
  {
    key: 'ahead',
    label: 'Ahead by'
  }
];

export default {
  inject: ['openmct', 'domainObject', 'path'],
  props: {
    bounds: {
      type: Object,
      default() {
        return {};
      }
    },
    timeSystem: {
      type: Object,
      default() {
        return {};
      }
    },
    contentHeight: {
      type: Number,
      default() {
        return 0;
      }
    },
    renderingEngine: {
      type: String,
      default() {
        return 'svg';
      }
    },
    aheadBehind: {
      type: Object,
      default() {
        return {
          duration: 0,
          status: false
        };
      }
    }
  },
  setup() {
    const axisHolder = ref(null);
    const { size: containerSize, startObserving } = useResizeObserver();
    const svgWidth = ref(0);
    const svgHeight = ref(0);
    const axisTransform = ref('translate(0,20)');
    const alignmentOffset = ref(0);
    const nowMarkerStyle = reactive({
      height: '0px',
      left: '0px'
    });
    const aheadBehindMarkerStyle = reactive({
      width: '0px'
    });
    const lineWrapperStyle = reactive({
      height: '0px'
    });
    const showAheadBehind = ref(false);
    // The aheadOrBehindCSSClass has a default value of --ahead, but it will be hidden if there is not value for ahead/behind time
    const aheadOrBehindCSSClass = ref('--ahead');
    const formattedAheadBehindDuration = ref('');

    onMounted(() => {
      startObserving(axisHolder.value);
    });

    const domainObject = inject('domainObject');
    const objectPath = inject('path');
    const openmct = inject('openmct');
    const { alignment: alignmentData } = useAlignment(domainObject, objectPath, openmct);

    return {
      axisHolder,
      containerSize,
      alignmentData,
      svgWidth,
      svgHeight,
      axisTransform,
      alignmentOffset,
      nowMarkerStyle,
      openmct,
      aheadBehindMarkerStyle,
      lineWrapperStyle,
      showAheadBehind,
      aheadOrBehindCSSClass,
      formattedAheadBehindDuration
    };
  },
  watch: {
    alignmentData: {
      handler() {
        let leftOffset = 0;
        if (this.alignmentData.leftWidth) {
          leftOffset = this.alignmentData.multiple ? 2 * AXES_PADDING : AXES_PADDING;
        }
        this.axisTransform = `translate(${this.alignmentData.leftWidth + leftOffset}, 20)`;

        const rightOffset = this.alignmentData.rightWidth ? AXES_PADDING : 0;
        this.alignmentOffset =
          this.alignmentData.leftWidth + leftOffset + this.alignmentData.rightWidth + rightOffset;
        this.refresh();
      },
      deep: true
    },
    bounds(newBounds) {
      this.setDimensions();
      this.drawAxis(newBounds, this.timeSystem);
      this.updateTimeAxisMarkers();
    },
    timeSystem(newTimeSystem) {
      this.setDimensions();
      this.drawAxis(this.bounds, newTimeSystem);
      this.updateTimeAxisMarkers();
    },
    contentHeight() {
      this.updateLineWrapper();
      this.updateTimeAxisMarkers();
    },
    aheadBehind() {
      this.updateAheadBehindSettings();
      this.updateTimeAxisMarkers();
    },
    containerSize: {
      handler() {
        this.resize();
      },
      deep: true
    }
  },
  mounted() {
    if (this.renderingEngine === 'svg') {
      this.useSVG = true;
    }

    this.container = select(this.axisHolder);
    this.axisElement = this.container.select('.c-timesystem-axis__ticks').select('g.axis');

    this.refresh();
    this.resize();
  },
  unmounted() {
    clearInterval(this.resizeTimer);
  },
  methods: {
    resize() {
      if (this.axisHolder.clientWidth - this.alignmentOffset !== this.width) {
        this.refresh();
      }
    },
    refresh() {
      this.setDimensions();
      this.drawAxis(this.bounds, this.timeSystem);
      this.updateAheadBehindSettings();
      this.updateLineWrapper();
      this.updateNowMarker();
      this.updateAheadBehindMarker();
    },
    updateAheadBehindSettings() {
      this.showAheadBehind = !this.isNominal() && this.aheadBehind.duration > 0;
      this.aheadOrBehindCSSClass = this.getAheadOrBehindCSSClass();
      this.aheadBehindDuration = this.aheadBehind.duration * 60 * 1000;
      this.formattedAheadBehindDuration = getPreciseDuration(this.aheadBehindDuration, {
        excludeMilliSeconds: true,
        useDayFormat: true
      });
    },
    getAheadOrBehindCSSClass() {
      let cssClass = '';
      if (this.isBehind()) {
        cssClass = '--behind';
      } else if (this.isAhead()) {
        cssClass = '--ahead';
      }

      return cssClass;
    },
    isBehind() {
      return (
        this.aheadBehind.status &&
        this.aheadBehind.duration &&
        this.aheadBehind.status === executionMonitorStates[1].key
      );
    },
    isAhead() {
      return (
        this.aheadBehind.status &&
        this.aheadBehind.duration &&
        this.aheadBehind.status === executionMonitorStates[2].key
      );
    },
    isNominal() {
      return (
        !this.aheadBehind.duration ||
        !this.aheadBehind.status ||
        this.aheadBehind.status === executionMonitorStates[0].key
      );
    },
    updateTimeAxisMarkers() {
      this.updateNowMarker();
      this.updateAheadBehindMarker();
    },
    updateLineWrapper() {
      const lineWrapper = this.$refs.lineWrapper;
      if (lineWrapper) {
        this.lineWrapperStyle.height = this.contentHeight - TIME_AXIS_LINE_Y + 'px';
      }
    },
    updateNowMarker() {
      const nowMarker = this.$refs.nowMarker;
      if (nowMarker) {
        nowMarker.classList.remove('hidden');
        this.nowMarkerStyle.height = this.contentHeight - TIME_AXIS_LINE_Y + 'px';
        const nowTimeStamp = this.openmct.time.now();
        const now = this.xScale(nowTimeStamp);
        this.nowMarkerStyle.left = `${now + this.alignmentOffset}px`;
        if (now > this.width) {
          nowMarker.classList.add('hidden');
        }
      }
    },
    updateAheadBehindMarker() {
      const aheadBehindMarker = this.$refs.aheadBehindMarker;
      if (aheadBehindMarker) {
        aheadBehindMarker.classList.remove('hidden');

        const nowTimeStamp = this.openmct.time.now();
        const now = this.xScale(nowTimeStamp);

        if (now < 0 || now > this.width || this.isNominal()) {
          aheadBehindMarker.classList.add('hidden');
          this.aheadBehindMarkerStyle.width = '0px';
        } else {
          //We need the delta - we don't care if it's ahead or behind here.
          const relativeAheadBehindDuration = this.aheadBehindDuration + nowTimeStamp;
          const delta = this.xScale(relativeAheadBehindDuration) - now;
          this.aheadBehindMarkerStyle.width = delta + 'px';
        }
      }
    },
    setDimensions() {
      this.width = this.axisHolder.clientWidth - (this.alignmentOffset ?? 0);
      this.height = Math.round(this.axisHolder.getBoundingClientRect().height);

      if (this.useSVG) {
        this.svgWidth = this.width;
        this.svgHeight = this.height;
      } else {
        this.svgHeight = 50;
      }
    },
    drawAxis(bounds, timeSystem) {
      let viewBounds = Object.create(bounds);

      this.setScale(viewBounds, timeSystem);
      this.setAxis(viewBounds);
      this.axisElement.call(this.xAxis);
      this.updateNowMarker();
      this.updateAheadBehindMarker();
    },
    setScale(bounds, timeSystem) {
      if (!this.width) {
        return;
      }

      if (timeSystem === undefined) {
        timeSystem = this.openmct.time.getTimeSystem();
      }

      if (timeSystem.isUTCBased) {
        this.xScale = scaleUtc();
        this.xScale.domain([new Date(bounds.start), new Date(bounds.end)]);
      } else {
        this.xScale = scaleLinear();
        this.xScale.domain([bounds.start, bounds.end]);
      }

      this.xScale.range([PADDING, this.width - PADDING * 2]);
    },
    setAxis() {
      this.xAxis = axisTop(this.xScale);
      this.xAxis.tickFormat(utcMultiTimeFormat);

      if (this.width > 1800) {
        this.xAxis.ticks(this.width / PIXELS_PER_TICK_WIDE);
      } else {
        this.xAxis.ticks(this.width / PIXELS_PER_TICK);
      }
    }
  }
};
</script>
