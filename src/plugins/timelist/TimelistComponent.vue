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
  <div ref="timelistHolder" :class="listTypeClass">
    <template v-if="isExpanded">
      <expanded-view-item
        v-for="item in sortedItems"
        :key="item.key"
        :name="item.name"
        :start="item.start"
        :end="item.end"
        :duration="item.duration"
        :countdown="item.countdown"
        :css-class="item.cssClass"
        :item-properties="itemProperties"
        :execution-state="persistedActivityStates[item.id]"
        @click.stop="setSelectionForActivity(item, $event.currentTarget)"
      >
      </expanded-view-item>
    </template>
    <div v-else class="c-table c-table--sortable c-list-view c-list-view--sticky-header sticky">
      <table class="c-table__body js-table__body">
        <thead class="c-table__header">
          <tr>
            <list-header
              v-for="headerItem in headerItems"
              :key="headerItem.property"
              :direction="
                defaultSort.property === headerItem.property
                  ? defaultSort.defaultDirection
                  : headerItem.defaultDirection
              "
              :is-sortable="headerItem.isSortable"
              :aria-label="headerItem.name"
              :title="headerItem.name"
              :property="headerItem.property"
              :current-sort="defaultSort.property"
              @sort="sort"
            />
          </tr>
        </thead>
        <tbody>
          <list-item
            v-for="item in sortedItems"
            :key="item.key"
            :item="item"
            :item-properties="itemProperties"
            @click.stop="setSelectionForActivity(item, $event.currentTarget)"
          />
        </tbody>
      </table>
    </div>
  </div>
</template>

<script>
import _ from 'lodash';
import { v4 as uuid } from 'uuid';

import { TIME_CONTEXT_EVENTS } from '../../api/time/constants.js';
import ListHeader from '../../ui/components/List/ListHeader.vue';
import ListItem from '../../ui/components/List/ListItem.vue';
import { getPreciseDuration } from '../../utils/duration.js';
import { getFilteredValues, getValidatedData, getValidatedGroups } from '../plan/util.js';
import { SORT_ORDER_OPTIONS } from './constants.js';
import ExpandedViewItem from './ExpandedViewItem.vue';

const SCROLL_TIMEOUT = 10000;

const TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';
const SAME_DAY_PRECISION_SECONDS = 'HH:mm:ss';

const CURRENT_CSS_SUFFIX = '--is-current';
const PAST_CSS_SUFFIX = '--is-past';
const FUTURE_CSS_SUFFIX = '--is-future';

const headerItems = [
  {
    defaultDirection: true,
    isSortable: true,
    property: 'start',
    name: 'Start Time',
    format: function (value, object, key, openmct, options = {}) {
      const timeFormat = openmct.time.timeSystem().timeFormat;
      const timeFormatter = openmct.telemetry.getValueFormatter({ format: timeFormat }).formatter;
      if (options.skipDateForToday) {
        return timeFormatter.format(value, SAME_DAY_PRECISION_SECONDS);
      } else {
        return timeFormatter.format(value, TIME_FORMAT);
      }
    }
  },
  {
    defaultDirection: true,
    isSortable: true,
    property: 'end',
    name: 'End Time',
    format: function (value, object, key, openmct, options = {}) {
      const timeFormat = openmct.time.timeSystem().timeFormat;
      const timeFormatter = openmct.telemetry.getValueFormatter({ format: timeFormat }).formatter;
      if (options.skipDateForToday) {
        return timeFormatter.format(value, SAME_DAY_PRECISION_SECONDS);
      } else {
        return timeFormatter.format(value, TIME_FORMAT);
      }
    }
  },
  {
    defaultDirection: false,
    property: 'countdown',
    name: 'Time To/From',
    format: function (value, object, key, openmct, options = {}) {
      let result;
      if (value < 0) {
        const prefix = options.skipPrefix ? '' : '+';
        result = `${prefix}${getPreciseDuration(Math.abs(value), {
          excludeMilliSeconds: true,
          useDayFormat: true
        })}`;
      } else if (value > 0) {
        const prefix = options.skipPrefix ? '' : '-';
        result = `${prefix}${getPreciseDuration(value, {
          excludeMilliSeconds: true,
          useDayFormat: true
        })}`;
      } else {
        result = 'Now';
      }

      return result;
    }
  },
  {
    defaultDirection: false,
    property: 'duration',
    name: 'Duration',
    format: function (value, object, key, openmct) {
      return `${getPreciseDuration(value, { excludeMilliSeconds: true, useDayFormat: true })}`;
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
    ExpandedViewItem,
    ListHeader,
    ListItem
  },
  inject: ['openmct', 'domainObject', 'path', 'composition'],
  data() {
    return {
      planObjects: [],
      viewBounds: undefined,
      height: 0,
      planActivities: [],
      groups: [],
      headerItems: headerItems,
      defaultSort: defaultSort,
      isExpanded: false,
      persistedActivityStates: {},
      sortedItems: []
    };
  },
  computed: {
    listTypeClass() {
      if (this.isExpanded) {
        return 'c-timelist c-timelist--large';
      }
      return 'c-timelist';
    },
    itemProperties() {
      return this.headerItems.map((headerItem) => {
        return {
          key: headerItem.property,
          format: headerItem.format
        };
      });
    }
  },
  created() {
    this.updateTimestamp = _.throttle(this.updateTimestamp, 1000);
    this.deferAutoScroll = _.debounce(this.deferAutoScroll, 500);

    this.setTimeContext();
    this.timestamp = this.timeContext.now();
  },
  mounted() {
    this.isEditing = this.openmct.editor.isEditing();

    this.getPlanDataAndSetConfig(this.domainObject);
    this.getActivityStates();

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

    if (this.stopObservingPlan) {
      this.stopObservingPlan();
    }

    if (this.stopObservingActivityStatesObject) {
      this.stopObservingActivityStatesObject();
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
    async getActivityStates() {
      const activityStatesObject = await this.openmct.objects.get('activity-states');
      this.setActivityStates(activityStatesObject);
      this.stopObservingActivityStatesObject = this.openmct.objects.observe(
        activityStatesObject,
        '*',
        this.setActivityStates
      );
    },
    setActivityStates(activityStatesObject) {
      this.persistedActivityStates = activityStatesObject.activities;
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
        this.isExpanded = configuration.isExpanded;
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
      if (domainObject.type === 'plan') {
        this.getPlanDataAndSetConfig({
          ...this.domainObject,
          selectFile: domainObject.selectFile,
          sourceMap: domainObject.sourceMap
        });
      }
      //listen for changes to the plan
      if (this.stopObservingPlan) {
        this.stopObservingPlan();
      }
      this.stopObservingPlan = this.openmct.objects.observe(
        this.planObjects[0],
        '*',
        this.handlePlanChange
      );
    },
    handlePlanChange(planObject) {
      this.getPlanData(planObject);
      this.listActivities();
    },
    addToComposition(planObject) {
      if (this.planObjects.length > 0) {
        this.confirmReplacePlan(planObject);
      } else {
        this.addItem(planObject);
      }
    },
    confirmReplacePlan(planObject) {
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
              this.addItem(planObject);
              dialog.dismiss();
            }
          },
          {
            label: 'Cancel',
            callback: () => {
              this.removeFromComposition(planObject);
              dialog.dismiss();
            }
          }
        ]
      });
    },
    removeFromComposition(planObject) {
      this.composition.remove(planObject);
    },
    removeItem() {
      this.planObjects = [];
      this.resetPlanData();
    },
    resetPlanData() {
      this.planData = {};
      this.groups = [];
      this.planActivities = [];
      this.sortedItems = [];
    },
    getPlanData(domainObject) {
      this.resetPlanData();
      this.planData = getValidatedData(domainObject);
      this.groups = getValidatedGroups(this.domainObject, this.planData);
      this.groups.forEach((key) => {
        if (this.planData[key] === undefined) {
          return;
        }
        // Create new objects so Vue 3 can detect any changes
        this.planActivities.push(...this.planData[key]);
      });
    },

    listActivities() {
      // filter activities first, then sort
      const filteredItems = this.planActivities.filter(this.filterActivities);
      const sortedItems = this.sortItems(filteredItems);
      this.sortedItems = this.applyStyles(sortedItems);
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

      activity.duration = activity.end - activity.start;

      if (activity.start < this.timestamp) {
        //if the activity start time has passed, display the time to the end of the activity
        activity.countdown = activity.end - this.timestamp;
      } else {
        activity.countdown = activity.start - this.timestamp;
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
      if (!this.$el.parentElement || this.isExpanded) {
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
    sortItems(activities) {
      let sortedItems = _.sortBy(activities, this.defaultSort.property);
      if (!this.defaultSort.defaultDirection) {
        sortedItems = sortedItems.reverse();
      }
      return sortedItems;
    },
    setStatus(status) {
      this.status = status;
    },
    setEditState(isEditing) {
      this.isEditing = isEditing;
      this.setViewFromConfig(this.domainObject.configuration);
    },
    sort(data) {
      const property = data.property;
      const direction = data.direction;

      if (this.defaultSort.property === property) {
        this.defaultSort.defaultDirection = !this.defaultSort.defaultDirection;
      } else {
        this.defaultSort.property = property;
        this.defaultSort.defaultDirection = direction;
      }
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
