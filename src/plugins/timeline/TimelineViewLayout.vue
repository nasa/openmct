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
  <div ref="timelineHolder" class="c-timeline-holder">
    <swim-lane v-for="timeSystemItem in timeSystems" :key="timeSystemItem.timeSystem.key">
      <template #label>
        {{ timeSystemItem.timeSystem.name }}
      </template>
      <template #object>
        <timeline-axis
          :bounds="timeSystemItem.bounds"
          :time-system="timeSystemItem.timeSystem"
          :content-height="height"
          :rendering-engine="'svg'"
        />
      </template>
    </swim-lane>

    <div ref="contentHolder" class="c-timeline__objects">
      <timeline-object-view
        v-for="item in items"
        :key="item.keyString"
        class="c-timeline__content js-timeline__content"
        :item="item"
      />
    </div>
  </div>
</template>

<script>
import TimelineObjectView from './TimelineObjectView.vue';
import TimelineAxis from '../../ui/components/TimeSystemAxis.vue';
import SwimLane from '@/ui/components/swim-lane/SwimLane.vue';
import { getValidatedData } from '../plan/util';

const unknownObjectType = {
  definition: {
    cssClass: 'icon-object-unknown',
    name: 'Unknown Type'
  }
};

export default {
  components: {
    TimelineObjectView,
    TimelineAxis,
    SwimLane
  },
  inject: ['openmct', 'domainObject', 'composition', 'objectPath'],
  data() {
    return {
      items: [],
      timeSystems: [],
      height: 0,
      useIndependentTime: this.domainObject.configuration.useIndependentTime === true,
      timeOptions: this.domainObject.configuration.timeOptions
    };
  },
  beforeUnmount() {
    this.composition.off('add', this.addItem);
    this.composition.off('remove', this.removeItem);
    this.composition.off('reorder', this.reorder);
    this.stopFollowingTimeContext();
  },
  mounted() {
    this.items = [];
    this.setTimeContext();

    if (this.composition) {
      this.composition.on('add', this.addItem);
      this.composition.on('remove', this.removeItem);
      this.composition.on('reorder', this.reorder);
      this.composition.load();
    }
  },
  methods: {
    addItem(domainObject) {
      let type = this.openmct.types.get(domainObject.type) || unknownObjectType;
      let keyString = this.openmct.objects.makeKeyString(domainObject.identifier);
      let objectPath = [domainObject].concat(this.objectPath.slice());
      let rowCount = 0;
      if (domainObject.type === 'plan') {
        rowCount = Object.keys(getValidatedData(domainObject)).length;
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
    },
    removeItem(identifier) {
      let index = this.items.findIndex((item) =>
        this.openmct.objects.areIdsEqual(identifier, item.domainObject.identifier)
      );
      this.items.splice(index, 1);
    },
    reorder(reorderPlan) {
      let oldItems = this.items.slice();
      reorderPlan.forEach((reorderEvent) => {
        this.items[reorderEvent.newIndex] = oldItems[reorderEvent.oldIndex];
      });
    },
    updateContentHeight() {
      const clientHeight = this.getClientHeight();
      if (this.height !== clientHeight) {
        this.height = clientHeight;
      }
    },
    getClientHeight() {
      let clientHeight = this.$refs.contentHolder.getBoundingClientRect().height;

      if (!clientHeight) {
        //this is a hack - need a better way to find the parent of this component
        let parent = this.openmct.layout.$refs.browseObject.$el;
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
      const currentBounds = this.timeContext.bounds();

      //TODO: Some kind of translation via an offset? of current bounds to target timeSystem
      return currentBounds;
    },
    updateViewBounds() {
      const bounds = this.timeContext.bounds();
      this.updateContentHeight();
      let currentTimeSystem = this.timeSystems.find(
        (item) => item.timeSystem.key === this.openmct.time.timeSystem().key
      );
      if (currentTimeSystem) {
        currentTimeSystem.bounds = bounds;
      }
    },
    setTimeContext() {
      this.stopFollowingTimeContext();

      this.timeContext = this.openmct.time.getContextForView(this.objectPath);
      this.getTimeSystems();
      this.updateViewBounds();
      this.timeContext.on('bounds', this.updateViewBounds);
      this.timeContext.on('clock', this.updateViewBounds);
    },
    stopFollowingTimeContext() {
      if (this.timeContext) {
        this.timeContext.off('bounds', this.updateViewBounds);
        this.timeContext.off('clock', this.updateViewBounds);
      }
    }
  }
};
</script>
