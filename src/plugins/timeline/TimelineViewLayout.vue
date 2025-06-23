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

    <div v-if="isCompositionLoaded" ref="contentHolder" class="c-timeline__objects">
      <template v-for="(item, index) in items" :key="item.keyString">
        <TimelineObjectView
          class="c-timeline__content js-timeline__content"
          :class="`${'is-object-type-' + item.domainObject.type}`"
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
import { inject, onBeforeUnmount, onMounted, provide, ref, toRaw, watch } from 'vue';

import SwimLane from '@/ui/components/swim-lane/SwimLane.vue';
import ResizeHandle from '@/ui/layout/ResizeHandle/ResizeHandle.vue';

import TimelineAxis from '../../ui/components/TimeSystemAxis.vue';
import { useAlignment } from '../../ui/composables/alignmentContext.js';
import { getValidatedData, getValidatedGroups } from '../plan/util.js';
import Container from './Container.js';
import ExtendedLinesOverlay from './ExtendedLinesOverlay.vue';
import TimelineObjectView from './TimelineObjectView.vue';

const AXES_PADDING = 20;

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

    const items = ref([]);

    // COMPOSABLE - Time Contexts
    const timeSystems = ref([]);
    let timeContext;

    // returned from composition api setup()
    const setupTimeContexts = {
      timeSystems
    };

    onMounted(() => {
      setTimeContext();
    });

    onBeforeUnmount(() => {
      stopFollowingTimeContext();
    });

    function getTimeSystems() {
      openmct.time.getAllTimeSystems().forEach((timeSystem) => {
        timeSystems.value.push({
          timeSystem,
          bounds: getBoundsForTimeSystem(timeSystem)
        });
      });
    }

    function getBoundsForTimeSystem(timeSystem) {
      const currentBounds = timeContext.getBounds();

      //TODO: Some kind of translation via an offset? of current bounds to target timeSystem
      return currentBounds;
    }

    function updateViewBounds() {
      const bounds = timeContext.getBounds();
      updateContentHeight();

      let currentTimeSystemIndex = timeSystems.value.findIndex(
        (item) => item.timeSystem.key === openmct.time.getTimeSystem().key
      );
      if (currentTimeSystemIndex > -1) {
        let currentTimeSystem = {
          ...timeSystems.value[currentTimeSystemIndex]
        };
        currentTimeSystem.bounds = bounds;
        timeSystems.value.splice(currentTimeSystemIndex, 1, currentTimeSystem);
      }
    }

    function setTimeContext() {
      stopFollowingTimeContext();

      timeContext = openmct.time.getContextForView(path);
      getTimeSystems();
      updateViewBounds();
      timeContext.on('boundsChanged', updateViewBounds);
      timeContext.on('clockChanged', updateViewBounds);
    }

    function stopFollowingTimeContext() {
      if (timeContext) {
        timeContext.off('boundsChanged', updateViewBounds);
        timeContext.off('clockChanged', updateViewBounds);
      }
    }

    // COMPOSABLE - Content Height
    const timelineHolder = ref(null);
    const height = ref(null);
    let handleContentResize;
    let contentResizeObserver;

    // returned from composition api setup()
    const setupContentHeight = {
      timelineHolder,
      height
    };

    onMounted(() => {
      handleContentResize = _.debounce(updateContentHeight, 500);
      contentResizeObserver = new ResizeObserver(handleContentResize);
      contentResizeObserver.observe(timelineHolder.value);
    });

    onBeforeUnmount(() => {
      handleContentResize.cancel();
      contentResizeObserver.disconnect();
    });

    function updateContentHeight() {
      const clientHeight = getClientHeight();
      if (height.value !== clientHeight) {
        height.value = clientHeight;
      }
      calculateExtendedLinesLeftOffset();
    }

    function getClientHeight() {
      let clientHeight = timelineHolder.value.getBoundingClientRect().height;

      if (!clientHeight) {
        //this is a hack - need a better way to find the parent of this component
        let parent = timelineHolder.value.closest('.c-object-view');
        if (parent) {
          clientHeight = parent.getBoundingClientRect().height;
        }
      }

      return clientHeight;
    }

    // COMPOSABLE - Composition
    const composition = ref(null);
    const isCompositionLoaded = ref(false);

    const compositionCollection = openmct.composition.get(toRaw(domainObject));

    onMounted(() => {
      compositionCollection.on('add', addItem);
      compositionCollection.on('remove', removeItem);
      compositionCollection.on('reorder', reorder);
    });

    onBeforeUnmount(() => {
      compositionCollection.off('add', addItem);
      compositionCollection.off('remove', removeItem);
      compositionCollection.off('reorder', reorder);
    });

    const setupComposition = {
      composition,
      isCompositionLoaded
    };

    // COMPOSABLE - Extended Lines
    const extendedLinesBus = inject('extendedLinesBus');
    const extendedLinesPerKey = ref({});
    const extendedLinesLeftOffset = ref(0);
    const extendedLineHover = ref({});
    const extendedLineSelection = ref({});

    const { alignment: alignmentData, reset: resetAlignment } = useAlignment(
      domainObject,
      path,
      openmct
    );

    // returned from composition api setup()
    const setupExtendedLines = {
      extendedLinesBus,
      extendedLinesPerKey,
      extendedLinesLeftOffset,
      extendedLineHover,
      extendedLineSelection,
      calculateExtendedLinesLeftOffset
    };

    onMounted(() => {
      openmct.selection.on('change', checkForLineSelection);
      extendedLinesBus.addEventListener('update-extended-lines', updateExtendedLines);
      extendedLinesBus.addEventListener('update-extended-hover', updateExtendedHover);
    });

    onBeforeUnmount(() => {
      openmct.selection.off('change', checkForLineSelection);
      extendedLinesBus.removeEventListener('update-extended-lines', updateExtendedLines);
      extendedLinesBus.removeEventListener('update-extended-hover', updateExtendedHover);
      resetAlignment();
    });

    watch(alignmentData, () => calculateExtendedLinesLeftOffset(), { deep: true });

    function calculateExtendedLinesLeftOffset() {
      extendedLinesLeftOffset.value = alignmentData.leftWidth + calculateSwimlaneOffset();
    }

    function calculateSwimlaneOffset() {
      const firstSwimLane = timelineHolder.value.querySelector('.c-swimlane__lane-object');
      if (firstSwimLane) {
        const timelineHolderRect = timelineHolder.value.getBoundingClientRect();
        const laneObjectRect = firstSwimLane.getBoundingClientRect();
        const offset = laneObjectRect.left - timelineHolderRect.left;
        const hasAxes = alignmentData.axes && Object.keys(alignmentData.axes).length > 0;
        const swimLaneOffset = hasAxes ? offset + AXES_PADDING : offset;
        return swimLaneOffset;
      } else {
        return 0;
      }
    }

    function updateExtendedLines(event) {
      const { keyString, lines } = event.detail;
      extendedLinesPerKey.value[keyString] = lines;
    }
    function updateExtendedHover(event) {
      const { keyString, id } = event.detail;
      extendedLineHover.value = { keyString, id };
    }

    function checkForLineSelection(selection) {
      const selectionContext = selection?.[0]?.[0]?.context;
      const eventType = selectionContext?.type;
      if (eventType === 'time-strip-event-selection') {
        const event = selectionContext.event;
        const selectedObject = selectionContext.item;
        const keyString = openmct.objects.makeKeyString(selectedObject.identifier);
        extendedLineSelection.value = { keyString, id: event?.time };
      } else {
        extendedLineSelection.value = {};
      }
    }

    // COMPOSABLE - Swimlane label width
    const { x: swimLaneLabelWidth, mousedown } = useDragResizer({
      initialX: domainObject.configuration.swimLaneLabelWidth,
      callback: mutateSwimLaneLabelWidth
    });

    provide('swimLaneLabelWidth', swimLaneLabelWidth);
    provide('mousedown', mousedown);

    // returned from composition api setup()
    const setupSwimLaneLabelWidth = {
      changeSwimLaneLabelWidthContextAction
    };

    function mutateSwimLaneLabelWidth() {
      openmct.objects.mutate(
        domainObject,
        'configuration.swimLaneLabelWidth',
        swimLaneLabelWidth.value
      );
    }

    // context action called from outside component
    function changeSwimLaneLabelWidthContextAction(size) {
      swimLaneLabelWidth.value = size;
      mutateSwimLaneLabelWidth();
    }

    // COMPOSABLE - flexible containers for swimlane vertical resizing
    const existingContainers = [];

    watch(items, () => console.log('changed'));

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

    // returned from composition api setup()
    const setupFlexContainers = {
      containers,
      startContainerResizing,
      containerResizing,
      endContainerResizing,
      toggleFixedContextAction,
      changeSizeContextAction
    };

    compositionCollection.load().then((loadedComposition) => {
      composition.value = loadedComposition;
      isCompositionLoaded.value = true;

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
        setContainers(existingContainers);
      }

      setSelectionContext();
    });

    function setSelectionContext() {
      const selection = openmct.selection.get()[0];
      const selectionContext = selection?.[0]?.context;
      const selectionDomainObject = selectionContext?.item;
      const selectionType = selectionDomainObject?.type;

      if (selectionType === 'time-strip') {
        selectionContext.containers = containers.value;
        selectionContext.swimLaneLabelWidth = swimLaneLabelWidth.value;
        openmct.selection.select(selection);
      }
    }

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

      const item = {
        domainObject: _domainObject,
        objectPath,
        type,
        keyString,
        rowCount,
        isEventTelemetry
      };

      items.value.push(item);

      if (isCompositionLoaded.value) {
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

    return {
      openmct,
      domainObject,
      path,
      items,
      ...setupComposition,
      ...setupTimeContexts,
      ...setupContentHeight,
      ...setupExtendedLines,
      ...setupSwimLaneLabelWidth,
      ...setupFlexContainers
    };
  }
};
</script>
