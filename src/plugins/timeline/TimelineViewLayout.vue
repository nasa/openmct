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
    <SwimLane v-for="timeSystemItem in timeSystems" :key="timeSystemItem.timeSystem.key">
      <template #label>
        {{ timeSystemItem.timeSystem.name }}
      </template>
      <template #object>
        <TimelineAxis
          :bounds="timeSystemItem.bounds"
          :time-system="timeSystemItem.timeSystem"
          :content-height="height"
          :ahead-behind="aheadBehind"
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
      />
    </div>
  </div>
</template>

<script>
import _ from 'lodash';
import { inject } from 'vue';

import SwimLane from '@/ui/components/swim-lane/SwimLane.vue';

import TimelineAxis from '../../ui/components/TimeSystemAxis.vue';
import { useAlignment } from '../../ui/composables/alignmentContext.js';
import { getValidatedData, getValidatedGroups } from '../plan/util.js';
import { PLAN_EXECUTION_MONITORING_KEY } from '../planExecutionMonitoring/planExecutionMonitoringIdentifier.js';
import TimelineObjectView from './TimelineObjectView.vue';

const unknownObjectType = {
  definition: {
    cssClass: 'icon-object-unknown',
    name: 'Unknown Type'
  }
};

const DEFAULT_AHEAD_BEHIND_STATUS = {
  duration: 0,
  status: ''
};

export default {
  components: {
    TimelineObjectView,
    TimelineAxis,
    SwimLane
  },
  inject: ['openmct', 'domainObject', 'path', 'composition'],
  setup() {
    const domainObject = inject('domainObject');
    const path = inject('path');
    const openmct = inject('openmct');
    const { alignment: alignmentData, reset: resetAlignment } = useAlignment(
      domainObject,
      path,
      openmct
    );

    return { alignmentData, resetAlignment };
  },
  data() {
    return {
      aheadBehind: DEFAULT_AHEAD_BEHIND_STATUS,
      items: [],
      timeSystems: [],
      height: 0,
      useIndependentTime: this.domainObject.configuration.useIndependentTime === true,
      timeOptions: this.domainObject.configuration.timeOptions
    };
  },
  beforeUnmount() {
    this.resetAlignment();
    this.composition.off('add', this.addItem);
    this.composition.off('remove', this.removeItem);
    this.composition.off('reorder', this.reorder);
    this.stopFollowingTimeContext();
    this.handleContentResize.cancel();
    this.contentResizeObserver.disconnect();
    this.stopObservingPlanExecutionMonitoringStatusObject?.();
  },
  async mounted() {
    this.items = [];
    this.plans = [];
    this.setTimeContext();

    if (this.composition) {
      this.composition.on('add', this.addItem);
      this.composition.on('remove', this.removeItem);
      this.composition.on('reorder', this.reorder);
      await this.composition.load();
    }

    this.handleContentResize = _.debounce(this.handleContentResize, 500);
    this.contentResizeObserver = new ResizeObserver(this.handleContentResize);
    this.contentResizeObserver.observe(this.$refs.timelineHolder);

    this.planExecutionMonitoringStatusObject = await this.openmct.objects.get(
      PLAN_EXECUTION_MONITORING_KEY
    );
    this.setPlanExecutionMonitoringStatus(this.planExecutionMonitoringStatusObject);
    this.stopObservingPlanExecutionMonitoringStatusObject = this.openmct.objects.observe(
      this.planExecutionMonitoringStatusObject,
      '*',
      this.setPlanExecutionMonitoringStatus
    );
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
          ? `${domainObject.composition.length * 100}px`
          : '100px';
      let item = {
        domainObject,
        objectPath,
        type,
        keyString,
        rowCount,
        height
      };

      this.items.push(item);

      this.checkAddedForPlan(domainObject);
    },
    removeItem(identifier) {
      let index = this.items.findIndex((item) =>
        this.openmct.objects.areIdsEqual(identifier, item.domainObject.identifier)
      );
      this.items.splice(index, 1);

      this.checkRemovedForPlan(identifier);
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
    setPlanExecutionMonitoringStatus(newStatusObject) {
      let planIdentifier;

      planIdentifier = this.plans.filter(
        (identifier) => this.openmct.status.get(identifier) === 'current'
      )?.[0];
      if (planIdentifier === undefined) {
        planIdentifier = this.plans?.[0];
      }

      if (
        newStatusObject &&
        newStatusObject.execution_monitoring &&
        newStatusObject.execution_monitoring[planIdentifier]
      ) {
        this.aheadBehind = newStatusObject.execution_monitoring[planIdentifier];
      } else {
        this.aheadBehind = DEFAULT_AHEAD_BEHIND_STATUS;
      }
    },
    /*
     * Does not check for deeply nested plans
     */
    async checkAddedForPlan(_domainObject) {
      const planIdentifier = await this.getPlanIdentifier(_domainObject);

      if (planIdentifier) {
        this.plans.push(planIdentifier);
      }
    },
    checkRemovedForPlan(identifier) {
      const index = this.plans.findLastIndex((planIdentifier) =>
        this.openmct.objects.areIdsEqual(planIdentifier, identifier)
      );

      if (index > -1) {
        this.plans.splice(index, 1);
        this.setPlanExecutionMonitoringStatus(this.planExecutionMonitoringStatusObject);
      }
    },
    async getPlanIdentifier(_domainObject) {
      let planIdentifier;

      if (_domainObject.type === 'plan') {
        planIdentifier = this.openmct.objects.makeKeyString(_domainObject.identifier);
      } else if (_domainObject.type === 'gantt-chart') {
        const ganttChartComposition = this.openmct.composition.get(_domainObject);
        await ganttChartComposition.load();
        ganttChartComposition.forEach((child) => {
          if (child.type === 'plan') {
            planIdentifier = this.openmct.objects.makeKeyString(child.identifier);
          }
        });
      }

      return planIdentifier;
    }
  }
};
</script>
