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
  <div ref="timelineHolder" class="c-timeline-holder">
    <SwimLane
      v-for="timeSystemItem in timeSystems"
      :key="timeSystemItem.timeSystem.key"
      class="c-swimlane__time-axis"
    >
      <template #label>
        {{ timeSystemItem.timeSystem.name }}
      </template>
      <template #object>
        <TimelineAxis
          :bounds="timeSystemItem.bounds"
          :time-system="timeSystemItem.timeSystem"
          :content-height="height"
          :rendering-engine="'svg'"
        />
      </template>
    </SwimLane>

    <div ref="contentHolder" class="c-timeline__objects">
      <TimelineObjectView
        v-for="item in items"
        :key="item.keyString"
        class="c-timeline__content js-timeline__content"
        :item="item"
        :extended-lines-bus
      />
    </div>

    <ExtendedLinesOverlay
      :extended-lines-per-key="extendedLinesPerKey"
      :height="height"
      :left-offset="extendedLinesLeftOffset"
      :extended-line-hover="extendedLineHover"
      :extended-line-selection="extendedLineSelection"
    />
  </div>
</template>

<script>
import _ from 'lodash';
import { useDragResizer } from 'utils/vue/useDragResizer.js';
import { inject, provide } from 'vue';

import SwimLane from '@/ui/components/swim-lane/SwimLane.vue';

import TimelineAxis from '../../ui/components/TimeSystemAxis.vue';
import { useAlignment } from '../../ui/composables/alignmentContext.js';
import { getValidatedData, getValidatedGroups } from '../plan/util.js';
import ExtendedLinesOverlay from './ExtendedLinesOverlay.vue';
import TimelineObjectView from './TimelineObjectView.vue';

const unknownObjectType = {
  definition: {
    cssClass: 'icon-object-unknown',
    name: 'Unknown Type'
  }
};

const AXES_PADDING = 20;
const PLOT_ITEM_H_PX = 100;

export default {
  components: {
    TimelineObjectView,
    TimelineAxis,
    SwimLane,
    ExtendedLinesOverlay
  },
  inject: ['openmct', 'domainObject', 'path', 'composition', 'extendedLinesBus'],
  props: {
    isEditing: {
      type: Boolean,
      default: false
    }
  },
  setup() {
    const domainObject = inject('domainObject');
    const path = inject('path');
    const openmct = inject('openmct');
    const { alignment: alignmentData, reset: resetAlignment } = useAlignment(
      domainObject,
      path,
      openmct
    );

    // Drag resizer - Swimlane column width
    const { size, mousedown } = useDragResizer('horizontal', { size: 200 });

    provide('swimLaneLabelWidth', size);
    provide('mousedown', mousedown);

    return { alignmentData, resetAlignment };
  },
  data() {
    return {
      items: [],
      timeSystems: [],
      height: 0,
      useIndependentTime: this.domainObject.configuration.useIndependentTime === true,
      timeOptions: this.domainObject.configuration.timeOptions,
      extendedLinesPerKey: {},
      extendedLineHover: {},
      extendedLineSelection: {},
      extendedLinesLeftOffset: 0
    };
  },
  watch: {
    alignmentData: {
      handler() {
        this.calculateExtendedLinesLeftOffset();
      },
      deep: true
    }
  },
  beforeUnmount() {
    this.resetAlignment();
    this.composition.off('add', this.addItem);
    this.composition.off('remove', this.removeItem);
    this.composition.off('reorder', this.reorder);
    this.stopFollowingTimeContext();
    this.handleContentResize.cancel();
    this.contentResizeObserver.disconnect();
    this.extendedLinesBus.off('update-extended-lines', this.updateExtendedLines);
    this.extendedLinesBus.off('update-extended-hover', this.updateExtendedHover);
    this.openmct.selection.off('change', this.checkForLineSelection);
  },
  mounted() {
    this.items = [];
    this.setTimeContext();

    this.extendedLinesBus.on('update-extended-lines', this.updateExtendedLines);
    this.extendedLinesBus.on('update-extended-hover', this.updateExtendedHover);
    this.openmct.selection.on('change', this.checkForLineSelection);

    if (this.composition) {
      this.composition.on('add', this.addItem);
      this.composition.on('remove', this.removeItem);
      this.composition.on('reorder', this.reorder);
      this.composition.load();
    }

    this.handleContentResize = _.debounce(this.handleContentResize, 500);
    this.contentResizeObserver = new ResizeObserver(this.handleContentResize);
    this.contentResizeObserver.observe(this.$refs.timelineHolder);
  },
  methods: {
    addItem(domainObject) {
      let type = this.openmct.types.get(domainObject.type) || unknownObjectType;
      let keyString = this.openmct.objects.makeKeyString(domainObject.identifier);
      let objectPath = [domainObject].concat(this.path.slice());
      let rowCount = 0;
      if (domainObject.type === 'plan') {
        const planData = getValidatedData(domainObject);
        rowCount = getValidatedGroups(domainObject, planData).length;
      } else if (domainObject.type === 'gantt-chart') {
        rowCount = Object.keys(domainObject.configuration.swimlaneVisibility).length;
      }

      let height =
        domainObject.type === 'telemetry.plot.stacked'
          ? `${domainObject.composition.length * PLOT_ITEM_H_PX}px`
          : 'auto';
      let item = {
        domainObject,
        objectPath,
        type,
        keyString,
        rowCount,
        height
      };

      this.items.push(item);
    },
    removeItem(identifier) {
      let index = this.items.findIndex((item) =>
        this.openmct.objects.areIdsEqual(identifier, item.domainObject.identifier)
      );
      this.items.splice(index, 1);
      delete this.extendedLinesPerKey[this.openmct.objects.makeKeyString(identifier)];
    },
    reorder(reorderPlan) {
      let oldItems = this.items.slice();
      reorderPlan.forEach((reorderEvent) => {
        this.items[reorderEvent.newIndex] = oldItems[reorderEvent.oldIndex];
      });
    },
    handleContentResize() {
      this.updateContentHeight();
    },
    updateContentHeight() {
      const clientHeight = this.getClientHeight();
      if (this.height !== clientHeight) {
        this.height = clientHeight;
      }
      this.calculateExtendedLinesLeftOffset();
    },
    getClientHeight() {
      let clientHeight = this.$refs.timelineHolder.getBoundingClientRect().height;

      if (!clientHeight) {
        //this is a hack - need a better way to find the parent of this component
        let parent = this.$el.closest('.c-object-view');
        if (parent) {
          clientHeight = parent.getBoundingClientRect().height;
        }
      }

      return clientHeight;
    },
    getTimeSystems() {
      const timeSystems = this.openmct.time.getAllTimeSystems();
      timeSystems.forEach((timeSystem) => {
        this.timeSystems.push({
          timeSystem,
          bounds: this.getBoundsForTimeSystem(timeSystem)
        });
      });
    },
    getBoundsForTimeSystem(timeSystem) {
      const currentBounds = this.timeContext.getBounds();

      //TODO: Some kind of translation via an offset? of current bounds to target timeSystem
      return currentBounds;
    },
    updateViewBounds() {
      const bounds = this.timeContext.getBounds();
      this.updateContentHeight();
      let currentTimeSystemIndex = this.timeSystems.findIndex(
        (item) => item.timeSystem.key === this.openmct.time.getTimeSystem().key
      );
      if (currentTimeSystemIndex > -1) {
        let currentTimeSystem = {
          ...this.timeSystems[currentTimeSystemIndex]
        };
        currentTimeSystem.bounds = bounds;
        this.timeSystems.splice(currentTimeSystemIndex, 1, currentTimeSystem);
      }
    },
    setTimeContext() {
      this.stopFollowingTimeContext();

      this.timeContext = this.openmct.time.getContextForView(this.path);
      this.getTimeSystems();
      this.updateViewBounds();
      this.timeContext.on('boundsChanged', this.updateViewBounds);
      this.timeContext.on('clockChanged', this.updateViewBounds);
    },
    stopFollowingTimeContext() {
      if (this.timeContext) {
        this.timeContext.off('boundsChanged', this.updateViewBounds);
        this.timeContext.off('clockChanged', this.updateViewBounds);
      }
    },
    updateExtendedLines({ keyString, lines }) {
      this.extendedLinesPerKey[keyString] = lines;
    },
    updateExtendedHover({ keyString, id }) {
      this.extendedLineHover = { keyString, id };
    },
    checkForLineSelection(selection) {
      const selectionContext = selection?.[0]?.[0]?.context;
      const eventType = selectionContext?.type;
      if (eventType === 'time-strip-event-selection') {
        const event = selectionContext.event;
        const selectedObject = selectionContext.item;
        const keyString = this.openmct.objects.makeKeyString(selectedObject.identifier);
        this.extendedLineSelection = { keyString, id: event?.time };
      } else {
        this.extendedLineSelection = {};
      }
    },
    calculateExtendedLinesLeftOffset() {
      const swimLaneOffset = this.calculateSwimlaneOffset();
      this.extendedLinesLeftOffset = this.alignmentData.leftWidth + swimLaneOffset;
    },
    calculateSwimlaneOffset() {
      const firstSwimLane = this.$el.querySelector('.c-swimlane__lane-object');
      if (firstSwimLane) {
        const timelineHolderRect = this.$refs.timelineHolder.getBoundingClientRect();
        const laneObjectRect = firstSwimLane.getBoundingClientRect();
        const offset = laneObjectRect.left - timelineHolderRect.left;
        const hasAxes = this.alignmentData.axes && Object.keys(this.alignmentData.axes).length > 0;
        const swimLaneOffset = hasAxes ? offset + AXES_PADDING : offset;
        return swimLaneOffset;
      } else {
        return 0;
      }
    }
  }
};
</script>
