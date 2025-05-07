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
      :can-show-resize-handle="true"
      :resize-handle-height="height"
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
      <template v-for="(item, index) in items" :key="item.keyString">
        <TimelineObjectView
          class="c-timeline__content js-timeline__content"
          :item="item"
          :container="containers[index]"
          :extended-lines-bus
        />
        <ResizeHandle
          v-if="index !== items.length - 1"
          :index="index"
          drag-orientation="vertical"
          :is-editing="isEditing"
          @init-move="startContainerResizing"
          @move="containerResizing"
          @end-move="endContainerResizing"
        />
      </template>
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
import { useFlexContainers } from 'utils/vue/useFlexContainers.js';
import { inject, onBeforeUnmount, provide, ref, toRaw } from 'vue';

import SwimLane from '@/ui/components/swim-lane/SwimLane.vue';
import ResizeHandle from '@/ui/layout/ResizeHandle/ResizeHandle.vue';

import TimelineAxis from '../../ui/components/TimeSystemAxis.vue';
import { useAlignment } from '../../ui/composables/alignmentContext.js';
import { getValidatedData, getValidatedGroups } from '../plan/util.js';
import Container from './Container.js';
import ExtendedLinesOverlay from './ExtendedLinesOverlay.vue';
import TimelineObjectView from './TimelineObjectView.vue';

const AXES_PADDING = 20;
const PLOT_ITEM_H_PX = 100;

export default {
  components: {
    ResizeHandle,
    TimelineObjectView,
    TimelineAxis,
    SwimLane,
    ExtendedLinesOverlay
  },
  props: {
    isEditing: {
      type: Boolean,
      default: false
    }
  },
  setup() {
    const openmct = inject('openmct');
    const domainObject = inject('domainObject');
    const path = inject('path');
    const extendedLinesBus = inject('extendedLinesBus');

    const composition = ref(null);
    let isCompositionLoaded = false;
    const existingContainers = [];
    const compositionCollection = openmct.composition.get(toRaw(domainObject));
    compositionCollection.on('add', addItem);
    compositionCollection.on('remove', removeItem);
    compositionCollection.on('reorder', reorder);

    const items = ref([]);
    const extendedLinesPerKey = ref({});

    const { alignment: alignmentData, reset: resetAlignment } = useAlignment(
      domainObject,
      path,
      openmct
    );

    // Drag resizer - Swimlane column width
    const { x: swimLaneLabelWidth, mousedown } = useDragResizer({
      initialX: domainObject.configuration.swimLaneLabelWidth,
      callback: mutateSwimLaneLabelWidth
    });

    provide('swimLaneLabelWidth', swimLaneLabelWidth);
    provide('mousedown', mousedown);

    function mutateSwimLaneLabelWidth() {
      openmct.objects.mutate(
        domainObject,
        'configuration.swimLaneLabelWidth',
        swimLaneLabelWidth.value
      );
    }

    // Flex containers - Swimlane height
    const timelineHolder = ref(null);

    const {
      addContainer,
      removeContainer,
      reorderContainers,
      setContainers,
      containers,
      startContainerResizing,
      containerResizing,
      endContainerResizing,
      toggleFixed,
      sizeFixedContainer
    } = useFlexContainers(timelineHolder, {
      containers: domainObject.configuration.containers,
      rowsLayout: true,
      callback: mutateContainers
    });

    compositionCollection.load().then((loadedComposition) => {
      composition.value = loadedComposition;
      isCompositionLoaded = true;

      // check if containers configuration matches composition
      // in case composition has been modified outside of view
      // if so, rebuild containers to match composition
      // sync containers to composition,
      // in case composition modified outside of view
      // but do not mutate until user makes a change
      let isConfigurationChanged = false;
      composition.value.forEach((object, index) => {
        const containerIndex = domainObject.configuration.containers.findIndex((container) =>
          openmct.objects.areIdsEqual(container.domainObjectIdentifier, object.identifier)
        );

        if (containerIndex !== index) {
          isConfigurationChanged = true;
        }

        if (containerIndex > -1) {
          existingContainers.push(domainObject.configuration.containers[containerIndex]);
        } else {
          const container = new Container(object);
          existingContainers.push(container);
        }
      });

      // add check for total size not equal to 100? if comp and containers same, probably safe

      if (isConfigurationChanged) {
        console.log('yo');
        setContainers(existingContainers);
        mutateContainers();
      }
    });

    function addItem(_domainObject) {
      let rowCount = 0;

      const typeKey = _domainObject.type;
      const type = openmct.types.get(typeKey);
      const keyString = openmct.objects.makeKeyString(_domainObject.identifier);
      const objectPath = [_domainObject].concat(path.slice());

      if (typeKey === 'plan') {
        const planData = getValidatedData(_domainObject);
        rowCount = getValidatedGroups(_domainObject, planData).length;
      } else if (typeKey === 'gantt-chart') {
        rowCount = Object.keys(_domainObject.configuration.swimlaneVisibility).length;
      }
      const isEventTelemetry = hasEventTelemetry(_domainObject);
      const height =
        typeKey === 'telemetry.plot.stacked'
          ? `${_domainObject.composition.length * PLOT_ITEM_H_PX}px`
          : 'auto';
      const item = {
        domainObject: _domainObject,
        objectPath,
        type,
        keyString,
        rowCount,
        height,
        isEventTelemetry
      };

      items.value.push(item);

      if (isCompositionLoaded) {
        const container = new Container(domainObject);
        addContainer(container);
      }
    }

    function removeItem(identifier) {
      const index = items.value.findIndex((item) =>
        openmct.objects.areIdsEqual(identifier, item.domainObject.identifier)
      );

      items.value.splice(index, 1);
      removeContainer(index);

      delete extendedLinesPerKey.value[openmct.objects.makeKeyString(identifier)];
    }

    function reorder(reorderPlan) {
      const oldItems = items.value.slice();
      reorderPlan.forEach((reorderEvent) => {
        items.value[reorderEvent.newIndex] = oldItems[reorderEvent.oldIndex];
      });

      reorderContainers(reorderPlan);
    }

    function hasEventTelemetry(_domainObject) {
      const metadata = openmct.telemetry.getMetadata(_domainObject);
      if (!metadata) {
        return false;
      }
      const hasDomain = metadata.valuesForHints(['domain']).length > 0;
      const hasNoRange = !metadata.valuesForHints(['range'])?.length;
      // for the moment, let's also exclude telemetry with images
      const hasNoImages = !metadata.valuesForHints(['image']).length;

      return hasDomain && hasNoRange && hasNoImages;
    }

    function getContainerSize(item) {
      const containerForItem = containers.value.find((container) =>
        openmct.objects.areIdsEqual(container.domainObjectIdentifier, item.domainObject.identifier)
      );

      return containerForItem?.size;
    }

    function mutateContainers() {
      openmct.objects.mutate(domainObject, 'configuration.containers', containers.value);
    }

    // context action called from outside component
    function toggleFixedContextAction(index, fixed) {
      toggleFixed(index, fixed);
    }

    // context action called from outside component
    function changeSizeContextAction(index, size) {
      sizeFixedContainer(index, size);
    }

    onBeforeUnmount(() => {
      compositionCollection.off('add', addItem);
      compositionCollection.off('remove', removeItem);
      compositionCollection.off('reorder', reorder);
    });

    return {
      openmct,
      domainObject,
      path,
      composition,
      extendedLinesBus,
      extendedLinesPerKey,
      containers,
      getContainerSize,
      timelineHolder,
      items,
      addContainer,
      removeContainer,
      reorderContainers,
      alignmentData,
      resetAlignment,
      startContainerResizing,
      containerResizing,
      endContainerResizing,
      mutateContainers,
      toggleFixedContextAction,
      changeSizeContextAction
    };
  },
  data() {
    return {
      timeSystems: [],
      height: 0,
      useIndependentTime: this.domainObject.configuration.useIndependentTime === true,
      timeOptions: this.domainObject.configuration.timeOptions,
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
    this.stopFollowingTimeContext();
    this.handleContentResize.cancel();
    this.contentResizeObserver.disconnect();
    this.openmct.selection.off('change', this.checkForLineSelection);
    this.extendedLinesBus.removeEventListener('update-extended-lines', this.updateExtendedLines);
    this.extendedLinesBus.removeEventListener('update-extended-hover', this.updateExtendedHover);
  },
  mounted() {
    this.setTimeContext();

    this.extendedLinesBus.addEventListener('update-extended-lines', this.updateExtendedLines);
    this.extendedLinesBus.addEventListener('update-extended-hover', this.updateExtendedHover);
    this.openmct.selection.on('change', this.checkForLineSelection);

    this.handleContentResize = _.debounce(this.handleContentResize, 500);
    this.contentResizeObserver = new ResizeObserver(this.handleContentResize);
    this.contentResizeObserver.observe(this.$refs.timelineHolder);
  },
  methods: {
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
    updateExtendedLines(event) {
      const { keyString, lines } = event.detail;
      this.extendedLinesPerKey[keyString] = lines;
    },
    updateExtendedHover(event) {
      const { keyString, id } = event.detail;
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
