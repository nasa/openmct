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
  <div ref="timelistHolder" class="c-timelist">
    <list-view
      :items="planActivities"
      :header-items="headerItems"
      :default-sort="defaultSort"
      class="sticky"
      @item-selection-changed="setSelectionForActivity"
    />
  </div>
</template>

<script>
import _ from 'lodash';
import { v4 as uuid } from 'uuid';

import { TIME_CONTEXT_EVENTS } from '../../api/time/constants.js';
import ListView from '../../ui/components/List/ListView.vue';
import { getPreciseDuration } from '../../utils/duration.js';
import { getFilteredValues, getValidatedData, getValidatedGroups } from '../plan/util.js';
import { SORT_ORDER_OPTIONS } from './constants.js';

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
        result = `+${getPreciseDuration(Math.abs(value), {
          excludeMilliSeconds: true,
          useDayFormat: true
        })}`;
      } else if (value > 0) {
        result = `-${getPreciseDuration(value, { excludeMilliSeconds: true, useDayFormat: true })}`;
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
    this.updateTimestamp = _.throttle(this.updateTimestamp, 1000);

    this.setTimeContext();
    this.timestamp = this.timeContext.now();

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

    this.openmct.editor.on('isEditing', this.setEditState);

    this.deferAutoScroll = _.debounce(this.deferAutoScroll, 500);
    this.$el.parentElement.addEventListener('scroll', this.deferAutoScroll, true);

    if (this.composition) {
      this.composition.on('add', this.addToComposition);
      this.composition.on('remove', this.removeItem);
      this.composition.load();
    }

    this.setFixedTime(this.timeContext.getMode());
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
    this.stopFollowingTimeContext();

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
    setTimeContext() {
      this.stopFollowingTimeContext();
      this.timeContext = this.openmct.time.getContextForView(this.path);
      this.followTimeContext();
    },
    followTimeContext() {
      this.timeContext.on(TIME_CONTEXT_EVENTS.modeChanged, this.setFixedTime);
      this.timeContext.on(TIME_CONTEXT_EVENTS.tick, this.updateTimestamp);
    },
    stopFollowingTimeContext() {
      if (this.timeContext) {
        this.timeContext.off(TIME_CONTEXT_EVENTS.modeChanged, this.setFixedTime);
        this.timeContext.off(TIME_CONTEXT_EVENTS.tick, this.updateTimestamp);
      }
    },
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
      this.filterValue = configuration.filter || '';
      this.filterMetadataValue = configuration.filterMetadata || '';
      if (this.isEditing) {
        this.hideAll = false;
      } else {
        this.setSort();
      }
      this.listActivities();
    },
    updateTimestamp(timestamp) {
      //The clock never stops ticking
      this.updateTimeStampAndListActivities(timestamp);
    },
    setFixedTime() {
      this.filterValue = this.domainObject.configuration.filter || '';
      this.filterMetadataValue = this.domainObject.configuration.filterMetadata || '';
      this.isFixedTime = !this.timeContext.isRealTime();
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
    listActivities() {
      let groups = getValidatedGroups(this.domainObject, this.planData);
      let activities = [];

      groups.forEach((key) => {
        if (this.planData[key] === undefined) {
          return;
        }
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
        activity.start >= this.timeContext.bounds()?.start &&
        activity.start <= this.timeContext.bounds()?.end;
      const endInBounds =
        activity.end >= this.timeContext.bounds()?.start &&
        activity.end <= this.timeContext.bounds()?.end;
      const middleInBounds =
        activity.start <= this.timeContext.bounds()?.start &&
        activity.end >= this.timeContext.bounds()?.end;

      return startInBounds || endInBounds || middleInBounds;
    },
    filterActivities(activity) {
      if (this.isEditing) {
        return true;
      }

      let hasNameMatch = false;
      let hasMetadataMatch = false;
      if (this.filterValue || this.filterMetadataValue) {
        if (this.filterValue) {
          hasNameMatch = this.filterByName(activity.name);
        }
        if (this.filterMetadataValue) {
          hasMetadataMatch = this.filterByMetadata(activity);
        }
      } else {
        hasNameMatch = true;
        hasMetadataMatch = true;
      }

      const hasFilterMatch = hasNameMatch || hasMetadataMatch;
      if (hasFilterMatch === false || this.hideAll === true) {
        return false;
      }

      if (!this.isActivityInBounds(activity)) {
        return false;
      }
      //current event or future start event or past end event
      const showCurrentEvents = this.domainObject.configuration.currentEventsIndex > 0;

      const isCurrent =
        showCurrentEvents && this.timestamp >= activity.start && this.timestamp <= activity.end;
      const isPast = this.timestamp > activity.end;
      const isFuture = this.timestamp < activity.start;

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
    filterByMetadata(activity) {
      const filters = this.filterMetadataValue.split(',');

      return filters.some((search) => {
        const normalized = search.trim().toLowerCase();
        const regex = new RegExp(normalized);
        const activityValues = getFilteredValues(activity);

        return regex.test(activityValues.join().toLowerCase());
      });
    },
    // Add activity classes, increase activity counts by type,
    // set indices of the first occurrences of current and future activities - used for scrolling
    styleActivity(activity, index) {
      if (this.timestamp >= activity.start && this.timestamp <= activity.end) {
        activity.cssClass = CURRENT_CSS_SUFFIX;
        if (this.firstCurrentActivityIndex < 0) {
          this.firstCurrentActivityIndex = index;
        }
        this.currentActivitiesCount = this.currentActivitiesCount + 1;
      } else if (this.timestamp < activity.start) {
        activity.cssClass = FUTURE_CSS_SUFFIX;
        //the index of the first activity that's greater than the current timestamp
        if (this.firstFutureActivityIndex < 0) {
          this.firstFutureActivityIndex = index;
        }
        this.futureActivitiesCount = this.futureActivitiesCount + 1;
      } else {
        activity.cssClass = PAST_CSS_SUFFIX;
        this.pastActivitiesCount = this.pastActivitiesCount + 1;
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
    },
    applyStyles(activities) {
      this.firstCurrentOrFutureActivityIndex = -1;
      this.firstCurrentActivityIndex = -1;
      this.firstFutureActivityIndex = -1;
      this.currentActivitiesCount = 0;
      this.pastActivitiesCount = 0;
      this.futureActivitiesCount = 0;

      const styledActivities = activities.map(this.styleActivity);

      if (this.firstCurrentActivityIndex > -1) {
        this.firstCurrentOrFutureActivityIndex = this.firstCurrentActivityIndex;
      } else if (this.firstFutureActivityIndex > -1) {
        this.firstCurrentOrFutureActivityIndex = this.firstFutureActivityIndex;
      }

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

      this.firstCurrentOrFutureActivityIndex = -1;
      this.pastActivitiesCount = 0;
      this.currentActivitiesCount = 0;
      this.futureActivitiesCount = 0;
      this.$el.parentElement?.scrollTo({ top: 0 });
      this.autoScrolled = false;
    },
    setScrollTop() {
      //The view isn't ready yet
      if (!this.$el.parentElement) {
        return;
      }

      if (this.canAutoScroll() === false) {
        return;
      }

      // See #7167 for scrolling algorithm
      const scrollTop = this.calculateScrollOffset();

      if (scrollTop === undefined) {
        this.resetScroll();
      } else {
        this.$el.parentElement?.scrollTo({
          top: scrollTop,
          behavior: 'smooth'
        });
        this.autoScrolled = false;
      }
    },
    calculateScrollOffset() {
      let scrollTop;

      //No scrolling necessary if no past events are present
      if (this.pastActivitiesCount > 0) {
        const row = this.$el.querySelector('.js-list-item');
        const ROW_HEIGHT = row.getBoundingClientRect().height;

        const maxViewableActivities =
          Math.floor(this.$el.parentElement.getBoundingClientRect().height / ROW_HEIGHT) - 1;

        const currentAndFutureActivities = this.currentActivitiesCount + this.futureActivitiesCount;

        //If there is more viewable area than all current and future activities combined, then show some past events
        const numberOfPastEventsToShow = maxViewableActivities - currentAndFutureActivities;
        if (numberOfPastEventsToShow > 0) {
          //some past events can be shown - get that scroll index
          if (this.pastActivitiesCount > numberOfPastEventsToShow) {
            scrollTop =
              ROW_HEIGHT * (this.firstCurrentOrFutureActivityIndex + numberOfPastEventsToShow);
          }
        } else {
          // only show current and future events
          scrollTop = ROW_HEIGHT * this.firstCurrentOrFutureActivityIndex;
        }
      }

      return scrollTop;
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
    },
    setSelectionForActivity(activity, element) {
      const multiSelect = false;

      this.openmct.selection.select(
        [
          {
            element: element,
            context: {
              type: 'activity',
              activity: activity
            }
          },
          {
            element: this.openmct.layout.$refs.browseObject.$el,
            context: {
              item: this.domainObject,
              supportsMultiSelect: false
            }
          }
        ],
        multiSelect
      );
    }
  }
};
</script>
