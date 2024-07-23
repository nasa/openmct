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
    <div class="nowMarker" :style="nowMarkerStyle"><span class="icon-arrow-down"></span></div>
    <svg :width="svgWidth" :height="svgHeight">
      <g class="axis" font-size="1.3em" :transform="axisTransform"></g>
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

import { useAlignment } from '../composables/alignmentContext';
import { useResizeObserver } from '../composables/resize';

const PADDING = 1;
const PIXELS_PER_TICK = 100;
const PIXELS_PER_TICK_WIDE = 200;

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
    }
  },
  setup() {
    const axisHolder = ref(null);
    const { size: containerSize, startObserving } = useResizeObserver();
    const svgWidth = ref(0);
    const svgHeight = ref(0);
    const axisTransform = ref('translate(0,20)');
    const nowMarkerStyle = reactive({
      height: '0px',
      left: '0px'
    });

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
      nowMarkerStyle,
      openmct
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
      this.updateNowMarker();
    },
    timeSystem(newTimeSystem) {
      this.setDimensions();
      this.drawAxis(this.bounds, newTimeSystem);
      this.updateNowMarker();
    },
    contentHeight() {
      this.updateNowMarker();
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
    this.svgElement = this.container.select('svg');
    this.axisElement = this.svgElement.select('g.axis');

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
      this.updateNowMarker();
    },
    updateNowMarker() {
      const nowMarker = this.$el.querySelector('.nowMarker');
      if (nowMarker) {
        nowMarker.classList.remove('hidden');
        this.nowMarkerStyle.height = this.contentHeight + 'px';
        const nowTimeStamp = this.openmct.time.now();
        const now = this.xScale(nowTimeStamp);
        this.nowMarkerStyle.left = `${now + this.alignmentOffset}px`;
        if (now > this.width) {
          nowMarker.classList.add('hidden');
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
