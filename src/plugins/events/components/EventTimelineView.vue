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
  <div ref="events" class="c-events-tsv js-events-tsv" :style="{ left: leftOffset + 'px' }" />
</template>

<script>
import { scaleLinear, scaleUtc } from 'd3-scale';
import _ from 'lodash';
import mount from 'utils/mount';
import { inject } from 'vue';

import SwimLane from '@/ui/components/swim-lane/SwimLane.vue';

import { useAlignment } from '../../../ui/composables/alignmentContext.js';
import eventData from '../mixins/eventData.js';

const PADDING = 1;
const CONTAINER_CLASS = 'c-events-tsv__container';
const NO_ITEMS_CLASS = 'c-events-tsv__no-items';
const EVENT_WRAPPER_CLASS = 'c-events-tsv__event-wrapper';
const EVENT_SELECTED_CLASS = 'is-selected';
const ID_PREFIX = 'wrapper-';
const AXES_PADDING = 20;

export default {
  mixins: [eventData],
  inject: ['openmct', 'domainObject', 'objectPath', 'extendedLinesBus'],
  setup() {
    const domainObject = inject('domainObject');
    const objectPath = inject('objectPath');
    const openmct = inject('openmct');
    const { alignment: alignmentData } = useAlignment(domainObject, objectPath, openmct);
    return { alignmentData };
  },
  data() {
    const timeSystem = this.openmct.time.getTimeSystem();
    this.valueMetadata = {};
    this.requestCount = 0;

    return {
      viewBounds: null,
      height: 0,
      eventHistory: [],
      timeSystem: timeSystem,
      extendLines: false,
      titleKey: null,
      tooltip: null,
      selectedEvent: null
    };
  },
  computed: {
    leftOffset() {
      return this.alignmentData.leftWidth + AXES_PADDING;
    }
  },
  watch: {
    eventHistory: {
      handler(newHistory, oldHistory) {
        this.updatePlotEvents();
      },
      deep: true
    },
    alignmentData: {
      handler() {
        this.updateViewBounds();
      },
      deep: true
    }
  },
  mounted() {
    this.setDimensions();

    this.setScaleAndPlotEvents = this.setScaleAndPlotEvents.bind(this);
    this.updateViewBounds = this.updateViewBounds.bind(this);
    this.setTimeContext = this.setTimeContext.bind(this);
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

    this.unlisten = this.openmct.objects.observe(this.domainObject, '*', this.observeForChanges);
    this.extendedLinesBus.on('disable-extended-lines', this.disableExtendEventLines);
    this.extendedLinesBus.on('enable-extended-lines', this.enableExtendEventLines);
    this.extendedLinesBus.on('event-clicked', this.checkIfOurEvent);

    document.addEventListener('click', this.checkIfOutsideClick);
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
    this.extendedLinesBus.off('event-clicked', this.checkIfOurEvent);

    document.removeEventListener('click', this.checkIfOutsideClick);
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
    observeForChanges(mutatedObject) {
      this.updateViewBounds();
    },
    resize() {
      const clientWidth = this.getClientWidth();
      if (clientWidth !== this.width) {
        this.setDimensions();
        this.updateViewBounds();
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
    setScaleAndPlotEvents(timeSystem, clearAllEvents) {
      if (timeSystem) {
        this.timeSystem = timeSystem;
        this.timeFormatter = this.getFormatter(this.timeSystem.key);
      }

      this.setScale(this.timeSystem);
      this.updatePlotEvents(clearAllEvents);
    },
    getFormatter(key) {
      const metadata = this.openmct.telemetry.getMetadata(this.domainObject);

      const metadataValue = metadata.value(key) || { format: key };
      const valueFormatter = this.openmct.telemetry.getValueFormatter(metadataValue);

      return valueFormatter;
    },
    updatePlotEvents(clearAllEvents) {
      this.clearPreviousEvents(clearAllEvents);
      if (this.xScale) {
        this.drawEvents();
      }
    },
    clearPreviousEvents(clearAllEvents) {
      //TODO: Only clear items that are out of bounds
      let noItemsEl = this.$el.querySelectorAll(`.${NO_ITEMS_CLASS}`);
      noItemsEl.forEach((item) => {
        item.remove();
      });
      const events = this.$el.querySelectorAll(`.${EVENT_WRAPPER_CLASS}`);
      events.forEach((eventElm) => {
        if (clearAllEvents) {
          eventElm.remove();
        } else {
          const id = eventElm.getAttributeNS(null, 'id');
          if (id) {
            const timestamp = id.replace(ID_PREFIX, '');
            if (
              !this.isEventInBounds({
                time: timestamp
              })
            ) {
              eventElm.remove();
            }
          }
        }
      });
      if (this.extendLines) {
        this.emitExtendedLines();
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
    isEventInBounds(evenObj) {
      return evenObj.time <= this.viewBounds.end && evenObj.time >= this.viewBounds.start;
    },
    getEventsContainer() {
      const containerHeight = 100;
      const containerWidth = this.eventHistory.length ? this.width : 200;
      let eventContainer;

      let existingContainer = this.$el.querySelector(`.${CONTAINER_CLASS}`);
      if (existingContainer) {
        eventContainer = existingContainer;
        // eventContainer.style.maxWidth = `${containerWidth}px`;
      } else {
        if (this.destroyEventsContainer) {
          this.destroyEventsContainer();
        }
        const { vNode, destroy } = mount(
          {
            components: {
              SwimLane
            },
            provide: {
              openmct: this.openmct
            },
            data() {
              return {
                isNested: true
              };
            },
            template: `<swim-lane :is-nested="isNested" :hide-label="true">
                        <template v-slot:object>
                          <div class="c-events-tsv__container"/>
                        </template>
                       </swim-lane>`
          },
          {
            app: this.openmct.app
          }
        );

        this.destroyEventsContainer = destroy;
        const component = vNode.componentInstance;
        this.$refs.events.appendChild(component.$el);

        eventContainer = component.$el.querySelector(`.${CONTAINER_CLASS}`);
        // eventContainer.style.maxWidth = `${containerWidth}px`;
        // eventContainer.style.height = `${containerHeight}px`;
      }

      return eventContainer;
    },
    drawEvents() {
      let eventContainer = this.getEventsContainer();
      if (this.eventHistory.length) {
        this.eventHistory.forEach((currentEventObject) => {
          if (this.isEventInBounds(currentEventObject)) {
            this.plotEvents(currentEventObject, eventContainer);
          }
        });
      } else {
        this.plotNoItems(eventContainer);
      }
    },
    plotNoItems(containerElement) {
      const textElement = document.createElement('div');
      textElement.classList.add(NO_ITEMS_CLASS);
      textElement.innerHTML = 'No events within timeframe';

      containerElement.appendChild(textElement);
    },
    getEventWrapper(item) {
      const id = `${ID_PREFIX}${item.time}`;

      return this.$el.querySelector(`.js-events-tsv div[id=${id}]`);
    },
    plotEvents(item, containerElement) {
      const existingEventWrapper = this.getEventWrapper(item);
      // eventWrapper wraps the vertical tick and the EVENT
      if (existingEventWrapper) {
        this.updateExistingEventWrapper(existingEventWrapper, item);
      } else {
        const eventWrapper = this.createEventWrapper(item);
        containerElement.appendChild(eventWrapper);
      }

      if (this.extendLines) {
        this.emitExtendedLines();
      }
    },
    updateExistingEventWrapper(existingEventWrapper, event) {
      existingEventWrapper.style.left = `${this.xScale(event.time)}px`;
    },
    createPathSelection() {
      const selection = [];
      selection.unshift({
        element: this.$el,
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
    createSelectionForInspector(event) {
      const eventContext = {
        type: 'time-strip-event-selection',
        event
      };

      const selection = this.createPathSelection();
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
          element: this.$el,
          context: {
            item: this.domainObject,
            ...eventContext
          }
        });
      }
      this.openmct.selection.select(selection, true);
    },
    createEventWrapper(event) {
      const id = `${ID_PREFIX}${event.time}`;
      const eventWrapper = document.createElement('div');
      eventWrapper.ariaLabel = id;
      eventWrapper.setAttribute('id', id);
      eventWrapper.classList.add(EVENT_WRAPPER_CLASS);
      eventWrapper.style.left = `${this.xScale(event.time)}px`;
      const eventTickElement = document.createElement('div');
      eventTickElement.classList.add('c-events-tsv__event-handle');
      if (this.titleKey) {
        const textToShow = event[this.titleKey];
        eventWrapper.addEventListener('mouseover', () => {
          this.showToolTip(textToShow, eventTickElement);
        });
        eventWrapper.addEventListener('mouseleave', () => {
          this.tooltip?.destroy();
        });
      }
      eventWrapper.appendChild(eventTickElement);
      const limitEvaluation = this.limitEvaluator.evaluate(event, this.valueMetadata);
      const limitClass = limitEvaluation?.cssClass;
      if (limitClass) {
        eventWrapper.classList.add(limitClass);
        event.limitClass = limitClass;
      }

      eventWrapper.addEventListener('click', (mouseEvent) => {
        mouseEvent.stopPropagation();
        this.createSelectionForInspector(event);
        this.toggleEventSelection(eventTickElement);
        this.extendedLinesBus.eventClicked(this.keyString);
      });

      return eventWrapper;
    },
    emitExtendedLines() {
      if (this.extendLines) {
        const lines = this.eventHistory
          .filter((e) => this.isEventInBounds(e))
          .map((e) => ({ x: this.xScale(e.time), limitClass: e.limitClass }));
        this.extendedLinesBus.emit('update-extended-lines', {
          lines,
          keyString: this.keyString
        });
      } else {
        this.extendedLinesBus.emit('update-extended-lines', {
          lines: [],
          keyString: this.keyString
        });
      }
    },
    showToolTip(textToShow, referenceElement) {
      this.tooltip = this.openmct.tooltips.tooltip({
        toolTipText: textToShow,
        toolTipLocation: this.openmct.tooltips.TOOLTIP_LOCATIONS.RIGHT,
        parentElement: referenceElement,
        cssClasses: ['c-timeline-event-tooltip']
      });
    },
    checkIfOurEvent(keyString) {
      if (this.keyString !== keyString) {
        this.selectedEvent?.classList.remove(EVENT_SELECTED_CLASS);
        this.selectedEvent = null;
      }
    },
    toggleEventSelection(clickedEvent) {
      console.log(clickedEvent);
      this.selectedEvent?.classList.remove(EVENT_SELECTED_CLASS);
      clickedEvent.classList.add(EVENT_SELECTED_CLASS);
      this.selectedEvent = clickedEvent;
    },
    checkIfOutsideClick(event) {
      if (
        this.selectedEvent &&
        !this.selectedEvent.contains(event.target) &&
        !this.$refs.events.contains(event.target)
      ) {
        this.selectedEvent.classList.remove(EVENT_SELECTED_CLASS);
        this.selectedEvent = null;
      }
    }
  }
};
</script>
