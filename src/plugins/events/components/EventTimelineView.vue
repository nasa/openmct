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
  <div ref="events" class="c-events-tsv js-events-tsv" :style="alignmentStyle">
    <swim-lane v-if="eventItems.length" :is-nested="true" :hide-label="true">
      <template v-slot:object>
        <div ref="eventsContainer" class="c-events-tsv__container">
          <div
            v-for="event in eventItems"
            :id="`wrapper-${event.time}`"
            :ref="`wrapper-${event.time}`"
            :key="event.id"
            :aria-label="titleKey ? `${event[titleKey]}` : ''"
            class="c-events-tsv__event-line"
            :class="event.limitClass || ''"
            :style="`left: ${event.left}px`"
            @mouseover="showToolTip(event)"
            @mouseleave="dismissToolTip()"
            @click.stop="createSelectionForInspector(event)"
          ></div>
        </div>
      </template>
    </swim-lane>
    <div v-else class="c-timeline__no-items">No events within timeframe</div>
  </div>
</template>

<script>
import { scaleLinear, scaleUtc } from 'd3-scale';
import _ from 'lodash';
import { inject } from 'vue';

import SwimLane from '@/ui/components/swim-lane/SwimLane.vue';

import { useAlignment } from '../../../ui/composables/alignmentContext.js';
import eventData from '../mixins/eventData.js';
import tooltipHelpers from '../../../api/tooltips/tooltipMixins';

const PADDING = 1;
const AXES_PADDING = 20;

export default {
  components: { SwimLane },
  mixins: [eventData, tooltipHelpers],
  inject: ['openmct', 'domainObject', 'objectPath', 'extendedLinesBus'],
  setup() {
    const domainObject = inject('domainObject');
    const objectPath = inject('objectPath');
    const openmct = inject('openmct');
    const { alignment: alignmentData } = useAlignment(domainObject, objectPath, openmct);
    return { alignmentData };
  },
  data() {
    return {
      eventItems: [],
      eventHistory: [],
      titleKey: null
    };
  },
  computed: {
    alignmentStyle() {
      let leftOffset = 0;
      const rightOffset = this.alignmentData.rightWidth ? AXES_PADDING : 0;
      if (this.alignmentData.leftWidth) {
        leftOffset = this.alignmentData.multiple ? 2 * AXES_PADDING : AXES_PADDING;
      }
      return {
        margin: `0 ${this.alignmentData.rightWidth + rightOffset}px 0 ${this.alignmentData.leftWidth + leftOffset}px`
      };
    }
  },
  watch: {
    eventHistory: {
      handler() {
        this.updateEventItems();
      },
      deep: true
    },
    alignmentData: {
      handler() {
        this.setScaleAndPlotEvents(this.timeSystem);
      },
      deep: true
    }
  },
  created() {
    this.valueMetadata = {};
    this.height = 0;
    this.timeSystem = this.openmct.time.getTimeSystem();
    this.extendLines = false;
  },
  mounted() {
    this.setDimensions();
    this.setTimeContext();

    this.limitEvaluator = this.openmct.telemetry.limitEvaluator(this.domainObject);
    this.keyString = this.openmct.objects.makeKeyString(this.domainObject.identifier);
    const metadata = this.openmct.telemetry.getMetadata(this.domainObject);
    if (metadata) {
      this.valueMetadata =
        metadata.valuesForHints(['range'])[0] || this.firstNonDomainAttribute(metadata);
    }
    // title is in the metadata, and is either a "hint" with a "label", or failing that, the first string type we find
    this.titleKey =
      metadata.valuesForHints(['label'])?.[0]?.key ||
      metadata.values().find((metadatum) => metadatum.format === 'string')?.key;

    this.updateViewBounds();

    this.resize = _.debounce(this.resize, 400);
    this.eventStripResizeObserver = new ResizeObserver(this.resize);
    this.eventStripResizeObserver.observe(this.$refs.events);

    this.extendedLinesBus.on('disable-extended-lines', this.disableExtendEventLines);
    this.extendedLinesBus.on('enable-extended-lines', this.enableExtendEventLines);
  },
  beforeUnmount() {
    if (this.eventStripResizeObserver) {
      this.eventStripResizeObserver.disconnect();
    }

    this.stopFollowingTimeContext();
    if (this.unlisten) {
      this.unlisten();
    }
    if (this.destroyEventContainer) {
      this.destroyEventContainer();
    }

    this.extendedLinesBus.off('disable-extended-lines', this.disableExtendEventLines);
    this.extendedLinesBus.off('enable-extended-lines', this.enableExtendEventLines);
    this.extendedLinesBus.off('event-hovered', this.checkIfOurEvent);
  },
  methods: {
    setTimeContext() {
      this.stopFollowingTimeContext();
      this.timeContext = this.openmct.time.getContextForView(this.objectPath);
      this.timeContext.on('timeSystem', this.setScaleAndPlotEvents);
      this.timeContext.on('boundsChanged', this.updateViewBounds);
    },
    enableExtendEventLines(keyStringToEnable) {
      if (this.keyString === keyStringToEnable) {
        this.extendLines = true;
        this.emitExtendedLines();
      }
    },
    disableExtendEventLines(keyStringToDisable) {
      if (this.keyString === keyStringToDisable) {
        this.extendLines = false;
        // emit an empty array to clear the lines
        this.emitExtendedLines();
      }
    },
    firstNonDomainAttribute(metadata) {
      return metadata
        .values()
        .find((metadatum) => !metadatum.hints.domain && metadatum.key !== 'name');
    },
    stopFollowingTimeContext() {
      if (this.timeContext) {
        this.timeContext.off('timeSystem', this.setScaleAndPlotEvents);
        this.timeContext.off('boundsChanged', this.updateViewBounds);
      }
    },
    resize() {
      const clientWidth = this.getClientWidth();
      if (clientWidth !== this.width) {
        this.setDimensions();
        this.setScaleAndPlotEvents(this.timeSystem);
      }
    },
    getClientWidth() {
      let clientWidth = this.$refs.events.clientWidth;

      if (!clientWidth) {
        //this is a hack - need a better way to find the parent of this component
        const parent = this.openmct.layout.$refs.browseObject.$el;
        if (parent) {
          clientWidth = parent.getBoundingClientRect().width;
        }
      }

      return clientWidth;
    },
    updateViewBounds(bounds, isTick) {
      this.viewBounds = this.timeContext.getBounds();

      if (!this.timeSystem) {
        this.timeSystem = this.timeContext.getTimeSystem();
      }

      this.setScaleAndPlotEvents(this.timeSystem, !isTick);
    },
    setScaleAndPlotEvents(timeSystem) {
      if (timeSystem) {
        this.timeSystem = timeSystem;
        this.timeFormatter = this.getFormatter(this.timeSystem.key);
      }

      this.setScale(this.timeSystem);
      this.updateEventItems();
    },
    getFormatter(key) {
      const metadata = this.openmct.telemetry.getMetadata(this.domainObject);

      const metadataValue = metadata.value(key) || { format: key };
      const valueFormatter = this.openmct.telemetry.getValueFormatter(metadataValue);

      return valueFormatter;
    },
    updateEventItems() {
      if (this.xScale) {
        this.eventItems = this.eventHistory.map((eventHistoryItem) => {
          const limitClass = this.getLimitClass(eventHistoryItem);
          return {
            ...eventHistoryItem,
            left: this.xScale(eventHistoryItem.time),
            limitClass
          };
        });
        if (this.extendLines) {
          this.emitExtendedLines();
        }
      }
    },
    setDimensions() {
      const eventsHolder = this.$refs.events;
      this.width = this.getClientWidth();

      this.height = Math.round(eventsHolder.getBoundingClientRect().height);
    },
    setScale(timeSystem) {
      if (!this.width) {
        return;
      }

      if (!timeSystem) {
        timeSystem = this.timeContext.getTimeSystem();
      }

      if (timeSystem.isUTCBased) {
        this.xScale = scaleUtc();
        this.xScale.domain([new Date(this.viewBounds.start), new Date(this.viewBounds.end)]);
      } else {
        this.xScale = scaleLinear();
        this.xScale.domain([this.viewBounds.start, this.viewBounds.end]);
      }

      this.xScale.range([PADDING, this.width - PADDING * 2]);
    },
    createPathSelection(eventWrapper) {
      const selection = [];
      selection.unshift({
        element: eventWrapper,
        context: {
          item: this.domainObject
        }
      });
      this.objectPath.forEach((pathObject) => {
        selection.push({
          element: this.openmct.layout.$refs.browseObject.$el,
          context: {
            item: pathObject
          }
        });
      });

      return selection;
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
    createSelectionForInspector(event) {

      const eventWrapper = this.$refs[`wrapper-${event.time}`][0];
      const eventContext = {
        type: 'time-strip-event-selection',
        event
      };

      const selection = this.createPathSelection(eventWrapper);
      if (
        selection.length &&
        this.openmct.objects.areIdsEqual(
          selection[0].context.item.identifier,
          this.domainObject.identifier
        )
      ) {
        selection[0].context = {
          ...selection[0].context,
          ...eventContext
        };
      } else {
        selection.unshift({
          element: eventWrapper,
          context: {
            item: this.domainObject,
            ...eventContext
          }
        });
      }
      this.openmct.selection.select(selection, true);
    },
    getLimitClass(event) {
      const limitEvaluation = this.limitEvaluator.evaluate(event, this.valueMetadata);
      return limitEvaluation?.cssClass;
    },
    showToolTip(event) {
      const aClasses = ['c-events-tooltip'];
      if (event.limitClass) {
        aClasses.push(event.limitClass);
      }
      const showToLeft = false; // Temp, stubbed in
      if (showToLeft) {
        aClasses.push('--left');
      }

      this.buildToolTip(
        this.titleKey ? `${event[this.titleKey]}` : '',
        this.openmct.tooltips.TOOLTIP_LOCATIONS.RIGHT,
        `wrapper-${event.time}`,
        [aClasses.join(' ')]
      );
      this.extendedLinesBus.updateHoverExtendEventLine(this.keyString, event.time);
    },
    dismissToolTip() {
      this.hideToolTip();
      this.extendedLinesBus.updateHoverExtendEventLine(this.keyString, null);
    },
    emitExtendedLines() {
      let lines = [];
      if (this.extendLines) {
        lines = this.eventItems.map((e) => ({
          x: e.left,
          limitClass: e.limitClass,
          id: e.time
        }));
      }
      this.extendedLinesBus.updateExtendedLines(this.keyString, lines);
    }
  }
};
</script>
