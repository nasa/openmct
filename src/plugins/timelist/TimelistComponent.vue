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
  <div ref="timelistHolder" class="c-timelist">
    <list-view
      :items="planActivities"
      :header-items="headerItems"
      :default-sort="defaultSort"
      class="sticky"
    />
  </div>
</template>

<script>
import _ from 'lodash';
import { v4 as uuid } from 'uuid';

import { TIME_CONTEXT_EVENTS } from '../../api/time/constants';
import ListView from '../../ui/components/List/ListView.vue';
import { getPreciseDuration } from '../../utils/duration';
import { getValidatedData } from '../plan/util';
import { SORT_ORDER_OPTIONS } from './constants';

const SCROLL_TIMEOUT = 10000;

const TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
const CURRENT_CSS_SUFFIX = '--is-current';
const PAST_CSS_SUFFIX = '--is-past';
const FUTURE_CSS_SUFFIX = '--is-future';
const headerItems = [
  {
    defaultDirection: true,
    isSortable: true,
    property: 'start',
    name: 'Start Time',
    format: function (value, object, key, openmct) {
      const timeFormat = openmct.time.timeSystem().timeFormat;
      const timeFormatter = openmct.telemetry.getValueFormatter({ format: timeFormat }).formatter;
      return timeFormatter.format(value, TIME_FORMAT);
    }
  },
  {
    defaultDirection: true,
    isSortable: true,
    property: 'end',
    name: 'End Time',
    format: function (value, object, key, openmct) {
      const timeFormat = openmct.time.timeSystem().timeFormat;
      const timeFormatter = openmct.telemetry.getValueFormatter({ format: timeFormat }).formatter;
      return timeFormatter.format(value, TIME_FORMAT);
    }
  },
  {
    defaultDirection: false,
    property: 'duration',
    name: 'Time To/From',
    format: function (value) {
      let result;
      if (value < 0) {
        result = `+${getPreciseDuration(Math.abs(value), true)}`;
      } else if (value > 0) {
        result = `-${getPreciseDuration(value, true)}`;
      } else {
        result = 'Now';
      }

      return result;
    }
  },
  {
    defaultDirection: true,
    property: 'name',
    name: 'Activity'
  }
];

const defaultSort = {
  property: 'start',
  defaultDirection: true
};

export default {
  components: {
    ListView
  },
  inject: ['openmct', 'domainObject', 'path', 'composition'],
  data() {
    return {
      planObjects: [],
      viewBounds: undefined,
      height: 0,
      planActivities: [],
      headerItems: headerItems,
      defaultSort: defaultSort
    };
  },
  mounted() {
    this.isEditing = this.openmct.editor.isEditing();
    this.timestamp = this.openmct.time.now();
    this.openmct.time.on(TIME_CONTEXT_EVENTS.modeChanged, this.setFixedTime);

    this.getPlanDataAndSetConfig(this.domainObject);

    this.unlisten = this.openmct.objects.observe(
      this.domainObject,
      'selectFile',
      this.planFileUpdated
    );
    this.unlistenConfig = this.openmct.objects.observe(
      this.domainObject,
      'configuration',
      this.setViewFromConfig
    );
    this.removeStatusListener = this.openmct.status.observe(
      this.domainObject.identifier,
      this.setStatus
    );
    this.status = this.openmct.status.get(this.domainObject.identifier);

    this.updateTimestamp = _.throttle(this.updateTimestamp, 1000);
    this.openmct.time.on('tick', this.updateTimestamp);
    this.openmct.editor.on('isEditing', this.setEditState);

    this.deferAutoScroll = _.debounce(this.deferAutoScroll, 500);
    this.$el.parentElement.addEventListener('scroll', this.deferAutoScroll, true);

    if (this.composition) {
      this.composition.on('add', this.addToComposition);
      this.composition.on('remove', this.removeItem);
      this.composition.load();
    }

    this.setFixedTime(this.openmct.time.getMode());
  },
  beforeUnmount() {
    if (this.unlisten) {
      this.unlisten();
    }

    if (this.unlistenConfig) {
      this.unlistenConfig();
    }

    if (this.removeStatusListener) {
      this.removeStatusListener();
    }

    this.openmct.editor.off('isEditing', this.setEditState);
    this.openmct.time.off('tick', this.updateTimestamp);
    this.openmct.time.off(TIME_CONTEXT_EVENTS.modeChanged, this.setFixedTime);

    this.$el.parentElement?.removeEventListener('scroll', this.deferAutoScroll, true);
    if (this.clearAutoScrollDisabledTimer) {
      clearTimeout(this.clearAutoScrollDisabledTimer);
    }

    if (this.composition) {
      this.composition.off('add', this.addToComposition);
      this.composition.off('remove', this.removeItem);
    }
  },
  methods: {
    planFileUpdated(selectFile) {
      this.getPlanData({
        selectFile,
        sourceMap: this.domainObject.sourceMap
      });
    },
    getPlanDataAndSetConfig(mutatedObject) {
      this.getPlanData(mutatedObject);
      this.setViewFromConfig(mutatedObject.configuration);
    },
    setViewFromConfig(configuration) {
      if (this.isEditing) {
        this.filterValue = configuration.filter;
        this.hideAll = false;
        this.listActivities();
      } else {
        this.filterValue = configuration.filter;
        this.setSort();
        this.setViewBounds();
        this.listActivities();
      }
    },
    updateTimestamp(timestamp) {
      //The clock never stops ticking
      this.updateTimeStampAndListActivities(timestamp);
    },
    setFixedTime() {
      this.filterValue = this.domainObject.configuration.filter;
      this.isFixedTime = !this.openmct.time.isRealTime();
      if (this.isFixedTime) {
        this.hideAll = false;
      }
    },
    addItem(domainObject) {
      this.planObjects = [domainObject];
      this.resetPlanData();
      if (domainObject.type === 'plan') {
        this.getPlanDataAndSetConfig({
          ...this.domainObject,
          selectFile: domainObject.selectFile,
          sourceMap: domainObject.sourceMap
        });
      }
    },
    addToComposition(telemetryObject) {
      if (this.planObjects.length > 0) {
        this.confirmReplacePlan(telemetryObject);
      } else {
        this.addItem(telemetryObject);
      }
    },
    confirmReplacePlan(telemetryObject) {
      const dialog = this.openmct.overlays.dialog({
        iconClass: 'alert',
        message: 'This action will replace the current plan. Do you want to continue?',
        buttons: [
          {
            label: 'Ok',
            emphasis: true,
            callback: () => {
              const oldTelemetryObject = this.planObjects[0];
              this.removeFromComposition(oldTelemetryObject);
              this.addItem(telemetryObject);
              dialog.dismiss();
            }
          },
          {
            label: 'Cancel',
            callback: () => {
              this.removeFromComposition(telemetryObject);
              dialog.dismiss();
            }
          }
        ]
      });
    },
    removeFromComposition(telemetryObject) {
      this.composition.remove(telemetryObject);
    },
    removeItem() {
      this.planObjects = [];
      this.resetPlanData();
    },
    resetPlanData() {
      this.planData = {};
    },
    getPlanData(domainObject) {
      this.planData = getValidatedData(domainObject);
    },
    setViewBounds() {
      const pastEventsIndex = this.domainObject.configuration.pastEventsIndex;
      const currentEventsIndex = this.domainObject.configuration.currentEventsIndex;
      const futureEventsIndex = this.domainObject.configuration.futureEventsIndex;
      const pastEventsDuration = this.domainObject.configuration.pastEventsDuration;
      const pastEventsDurationIndex = this.domainObject.configuration.pastEventsDurationIndex;
      const futureEventsDuration = this.domainObject.configuration.futureEventsDuration;
      const futureEventsDurationIndex = this.domainObject.configuration.futureEventsDurationIndex;

      if (pastEventsIndex === 0 && futureEventsIndex === 0 && currentEventsIndex === 0) {
        this.viewBounds = undefined;
        this.hideAll = true;

        return;
      }

      this.hideAll = false;

      if (pastEventsIndex === 1 && futureEventsIndex === 1 && currentEventsIndex === 1) {
        this.viewBounds = undefined;

        return;
      }

      this.viewBounds = {};

      if (pastEventsIndex !== 1) {
        const pastDurationInMS = this.getDurationInMilliSeconds(
          pastEventsDuration,
          pastEventsDurationIndex
        );
        this.viewBounds.pastEnd = (timestamp) => {
          if (pastEventsIndex === 2) {
            return timestamp - pastDurationInMS;
          } else if (pastEventsIndex === 0) {
            return timestamp + 1;
          }
        };
      }

      if (futureEventsIndex !== 1) {
        const futureDurationInMS = this.getDurationInMilliSeconds(
          futureEventsDuration,
          futureEventsDurationIndex
        );
        this.viewBounds.futureStart = (timestamp) => {
          if (futureEventsIndex === 2) {
            return timestamp + futureDurationInMS;
          } else if (futureEventsIndex === 0) {
            return 0;
          }
        };
      }
    },
    getDurationInMilliSeconds(duration, durationIndex) {
      if (duration > 0) {
        if (durationIndex === 0) {
          return duration * 1000;
        } else if (durationIndex === 1) {
          return duration * 60 * 1000;
        } else if (durationIndex === 2) {
          return duration * 60 * 60 * 1000;
        }
      }
    },
    listActivities() {
      let groups = Object.keys(this.planData);
      let activities = [];

      groups.forEach((key) => {
        // Create new objects so Vue 3 can detect any changes
        activities = activities.concat(JSON.parse(JSON.stringify(this.planData[key])));
      });
      // filter activities first, then sort by start time
      activities = activities.filter(this.filterActivities).sort(this.sortByStartTime);
      activities = this.applyStyles(activities);
      this.planActivities = [...activities];
      //We need to wait for the next tick since we need the height of the row from the DOM
      this.$nextTick(this.setScrollTop);
    },
    updateTimeStampAndListActivities(time) {
      this.timestamp = time;

      this.listActivities();
    },
    isActivityInBounds(activity) {
      const startInBounds =
        activity.start >= this.openmct.time.bounds()?.start &&
        activity.start <= this.openmct.time.bounds()?.end;
      const endInBounds =
        activity.end >= this.openmct.time.bounds()?.start &&
        activity.end <= this.openmct.time.bounds()?.end;
      const middleInBounds =
        activity.start <= this.openmct.time.bounds()?.start &&
        activity.end >= this.openmct.time.bounds()?.end;

      return startInBounds || endInBounds || middleInBounds;
    },
    filterActivities(activity, index) {
      if (this.isEditing) {
        return true;
      }

      const hasFilterMatch = this.filterByName(activity.name);
      if (hasFilterMatch === false || this.hideAll === true) {
        return false;
      }

      if (!this.isActivityInBounds(activity)) {
        return false;
      }
      //current event or future start event or past end event
      const isCurrent = this.timestamp >= activity.start && this.timestamp <= activity.end;
      const isPast =
        this.timestamp > activity.end &&
        (this.viewBounds?.pastEnd === undefined ||
          activity.end >= this.viewBounds?.pastEnd(this.timestamp));
      const isFuture =
        this.timestamp < activity.start &&
        (this.viewBounds?.futureStart === undefined ||
          activity.start <= this.viewBounds?.futureStart(this.timestamp));

      return isCurrent || isPast || isFuture;
    },
    filterByName(name) {
      const filters = this.filterValue.split(',');

      return filters.some((search) => {
        const normalized = search.trim().toLowerCase();
        const regex = new RegExp(normalized);

        return regex.test(name.toLowerCase());
      });
    },
    applyStyles(activities) {
      let firstCurrentActivityIndex = -1;
      let activityClosestToNowIndex = -1;
      let currentActivitiesCount = 0;
      const styledActivities = activities.map((activity, index) => {
        if (this.timestamp >= activity.start && this.timestamp <= activity.end) {
          activity.cssClass = CURRENT_CSS_SUFFIX;
          if (firstCurrentActivityIndex < 0) {
            firstCurrentActivityIndex = index;
          }

          currentActivitiesCount = currentActivitiesCount + 1;
        } else if (this.timestamp < activity.start) {
          activity.cssClass = FUTURE_CSS_SUFFIX;
          //the index of the first activity that's greater than the current timestamp
          if (activityClosestToNowIndex < 0) {
            activityClosestToNowIndex = index;
          }
        } else {
          activity.cssClass = PAST_CSS_SUFFIX;
        }

        if (!activity.key) {
          activity.key = uuid();
        }

        if (activity.start < this.timestamp) {
          //if the activity start time has passed, display the time to the end of the activity
          activity.duration = activity.end - this.timestamp;
        } else {
          activity.duration = activity.start - this.timestamp;
        }

        return activity;
      });

      this.activityClosestToNowIndex = activityClosestToNowIndex;
      this.firstCurrentActivityIndex = firstCurrentActivityIndex;
      this.currentActivitiesCount = currentActivitiesCount;

      return styledActivities;
    },
    canAutoScroll() {
      //this distinguishes between programmatic vs user-triggered scroll events
      this.autoScrolled = this.dontAutoScroll !== true;

      return this.autoScrolled;
    },
    resetScroll() {
      if (this.canAutoScroll() === false) {
        return;
      }

      this.firstCurrentActivityIndex = -1;
      this.activityClosestToNowIndex = -1;
      this.currentActivitiesCount = 0;
      this.$el.parentElement?.scrollTo({ top: 0 });
      this.autoScrolled = false;
    },
    setScrollTop() {
      //The view isn't ready yet
      if (!this.$el.parentElement) {
        return;
      }

      const row = this.$el.querySelector('.js-list-item');
      if (row && this.firstCurrentActivityIndex > -1) {
        // scroll to somewhere mid-way of the current activities
        const ROW_HEIGHT = row.getBoundingClientRect().height;

        if (this.canAutoScroll() === false) {
          return;
        }

        const scrollOffset =
          this.currentActivitiesCount > 0 ? Math.floor(this.currentActivitiesCount / 2) : 0;
        this.$el.parentElement?.scrollTo({
          top: ROW_HEIGHT * (this.firstCurrentActivityIndex + scrollOffset),
          behavior: 'smooth'
        });
        this.autoScrolled = false;
      } else if (row && this.activityClosestToNowIndex > -1) {
        // scroll to somewhere close to 'now'

        const ROW_HEIGHT = row.getBoundingClientRect().height;

        if (this.canAutoScroll() === false) {
          return;
        }

        this.$el.parentElement.scrollTo({
          top: ROW_HEIGHT * (this.activityClosestToNowIndex - 1),
          behavior: 'smooth'
        });
        this.autoScrolled = false;
      } else {
        // scroll to the top
        this.resetScroll();
      }
    },
    deferAutoScroll() {
      //if this is not a user-triggered event, don't defer auto scrolling
      if (this.autoScrolled) {
        this.autoScrolled = false;

        return;
      }

      this.dontAutoScroll = true;
      const self = this;
      if (this.clearAutoScrollDisabledTimer) {
        clearTimeout(this.clearAutoScrollDisabledTimer);
      }

      this.clearAutoScrollDisabledTimer = setTimeout(() => {
        self.dontAutoScroll = false;
        self.setScrollTop();
      }, SCROLL_TIMEOUT);
    },
    setSort() {
      const sortOrder = SORT_ORDER_OPTIONS[this.domainObject.configuration.sortOrderIndex];
      const property = sortOrder.property;
      const direction = sortOrder.direction.toLowerCase() === 'asc';
      this.defaultSort = {
        property,
        defaultDirection: direction
      };
    },
    sortByStartTime(a, b) {
      const numA = parseInt(a.start, 10);
      const numB = parseInt(b.start, 10);

      return numA - numB;
    },
    setStatus(status) {
      this.status = status;
    },
    setEditState(isEditing) {
      this.isEditing = isEditing;
      this.setViewFromConfig(this.domainObject.configuration);
    }
  }
};
</script>
