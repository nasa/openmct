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
import { getValidatedData } from '../plan/util';
import ListView from '../../ui/components/List/ListView.vue';
import { getPreciseDuration } from '../../utils/duration';
import { SORT_ORDER_OPTIONS } from './constants';
import _ from 'lodash';
import moment from 'moment';
import { v4 as uuid } from 'uuid';

const SCROLL_TIMEOUT = 10000;
const ROW_HEIGHT = 30;
const TIME_FORMAT = 'YYYY-MM-DD HH:mm:ss:SSS';
const headerItems = [
  {
    defaultDirection: true,
    isSortable: true,
    property: 'start',
    name: 'Start Time',
    format: function (value, object, key, openmct) {
      const clock = openmct.time.clock();
      if (clock && clock.formatTime) {
        return clock.formatTime(value);
      } else {
        return `${moment(value).format(TIME_FORMAT)}Z`;
      }
    }
  },
  {
    defaultDirection: true,
    isSortable: true,
    property: 'end',
    name: 'End Time',
    format: function (value, object, key, openmct) {
      const clock = openmct.time.clock();
      if (clock && clock.formatTime) {
        return clock.formatTime(value);
      } else {
        return `${moment(value).format(TIME_FORMAT)}Z`;
      }
    }
  },
  {
    defaultDirection: false,
    property: 'duration',
    name: 'Time To/From',
    format: function (value) {
      let result;
      if (value < 0) {
        result = `-${getPreciseDuration(Math.abs(value))}`;
      } else if (value > 0) {
        result = `+${getPreciseDuration(value)}`;
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
    this.planObjects = [];

    return {
      viewBounds: undefined,
      height: 0,
      planActivities: [],
      headerItems: headerItems,
      defaultSort: defaultSort
    };
  },
  mounted() {
    this.isEditing = this.openmct.editor.isEditing();
    this.timestamp = this.openmct.time.clock()?.currentValue() || this.openmct.time.bounds()?.start;
    this.openmct.time.on('clock', this.setViewFromClock);

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
    this.openmct.time.on('bounds', this.updateTimestamp);
    this.openmct.editor.on('isEditing', this.setEditState);

    this.deferAutoScroll = _.debounce(this.deferAutoScroll, 500);
    this.$el.parentElement.addEventListener('scroll', this.deferAutoScroll, true);

    if (this.composition) {
      this.composition.on('add', this.addToComposition);
      this.composition.on('remove', this.removeItem);
      this.composition.load();
    }

    this.setViewFromClock(this.openmct.time.clock());
  },
  beforeDestroy() {
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
    this.openmct.time.off('bounds', this.updateTimestamp);
    this.openmct.time.off('clock', this.setViewFromClock);

    this.$el.parentElement.removeEventListener('scroll', this.deferAutoScroll, true);
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
        this.showAll = true;
        this.listActivities();
      } else {
        this.filterValue = configuration.filter;
        this.setSort();
        this.setViewBounds();
        this.listActivities();
      }
    },
    updateTimestamp(_bounds, isTick) {
      if (isTick === true && this.openmct.time.clock() !== undefined) {
        this.updateTimeStampAndListActivities(this.openmct.time.clock().currentValue());
      }
    },
    setViewFromClock(newClock) {
      this.filterValue = this.domainObject.configuration.filter;
      const isFixedTime = newClock === undefined;
      if (isFixedTime) {
        this.hideAll = false;
        this.showAll = true;
        this.updateTimeStampAndListActivities(this.openmct.time.bounds()?.start);
      } else {
        this.setSort();
        this.setViewBounds();
        this.updateTimeStampAndListActivities(this.openmct.time.clock().currentValue());
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
        //don't show all events
        this.showAll = false;
        this.viewBounds = undefined;
        this.hideAll = true;

        return;
      }

      this.hideAll = false;

      if (pastEventsIndex === 1 && futureEventsIndex === 1 && currentEventsIndex === 1) {
        //show all events
        this.showAll = true;
        this.viewBounds = undefined;

        return;
      }

      this.showAll = false;

      this.viewBounds = {};

      this.noCurrent = currentEventsIndex === 0;

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
        activities = activities.concat(this.planData[key]);
      });
      activities = activities.filter(this.filterActivities);
      activities = this.applyStyles(activities);
      this.setScrollTop();
      // sort by start time
      this.planActivities = activities.sort(this.sortByStartTime);
    },
    updateTimeStampAndListActivities(time) {
      this.timestamp = time;

      this.listActivities();
    },
    filterActivities(activity, index) {
      const hasFilterMatch = this.filterByName(activity.name);

      if (hasFilterMatch === false || this.hideAll === true) {
        return false;
      }

      if (this.showAll === true) {
        return true;
      }

      //current event or future start event or past end event
      const isCurrent =
        this.noCurrent === false &&
        this.timestamp >= activity.start &&
        this.timestamp <= activity.end;
      const isPast =
        this.timestamp > activity.end &&
        (this.viewBounds.pastEnd === undefined ||
          activity.end >= this.viewBounds.pastEnd(this.timestamp));
      const isFuture =
        this.timestamp < activity.start &&
        (this.viewBounds.futureStart === undefined ||
          activity.start <= this.viewBounds.futureStart(this.timestamp));

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
      let currentActivitiesCount = 0;
      const styledActivities = activities.map((activity, index) => {
        if (this.timestamp >= activity.start && this.timestamp <= activity.end) {
          activity.cssClass = '--is-current';
          if (firstCurrentActivityIndex < 0) {
            firstCurrentActivityIndex = index;
          }

          currentActivitiesCount = currentActivitiesCount + 1;
        } else if (this.timestamp < activity.start) {
          activity.cssClass = '--is-future';
        } else {
          activity.cssClass = '--is-past';
        }

        if (!activity.key) {
          activity.key = uuid();
        }

        activity.duration = activity.start - this.timestamp;

        return activity;
      });

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
      this.currentActivitiesCount = 0;
      this.$el.parentElement?.scrollTo({ top: 0 });
      this.autoScrolled = false;
    },
    setScrollTop() {
      //scroll to somewhere mid-way of the current activities
      if (this.firstCurrentActivityIndex > -1) {
        if (this.canAutoScroll() === false) {
          return;
        }

        const scrollOffset =
          this.currentActivitiesCount > 0 ? Math.floor(this.currentActivitiesCount / 2) : 0;
        this.$el.parentElement.scrollTo({
          top: ROW_HEIGHT * (this.firstCurrentActivityIndex + scrollOffset),
          behavior: 'smooth'
        });
        this.autoScrolled = false;
      } else {
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
