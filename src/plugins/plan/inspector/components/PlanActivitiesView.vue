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
  <plan-activity-time-view
    v-for="activity in activities"
    :key="activity.key"
    :activity="activity"
    :heading="heading"
  />
  <plan-activity-properties-view
    v-for="activity in activities"
    :key="activity.key"
    heading="Properties"
    :activity="activity"
  />
  <plan-activity-status-view
    v-if="canPersistState"
    :key="activities[0].key"
    :activity="activities[0]"
    :execution-state="activityExecutionState"
    heading="Activity Status"
    @update-activity-state="persistActivityState"
  />
</template>

<script>
import { getPreciseDuration } from 'utils/duration';

import { getDisplayProperties } from '../../util.js';
import PlanActivityPropertiesView from './PlanActivityPropertiesView.vue';
import PlanActivityStatusView from './PlanActivityStatusView.vue';
import PlanActivityTimeView from './PlanActivityTimeView.vue';

const propertyLabels = {
  start: 'Start DateTime',
  end: 'End DateTime',
  duration: 'Duration',
  earliestStart: 'Earliest Start',
  latestEnd: 'Latest End',
  gap: 'Gap',
  overlap: 'Overlap',
  totalTime: 'Total Time',
  description: 'Description'
};
export default {
  components: {
    PlanActivityTimeView,
    PlanActivityPropertiesView,
    PlanActivityStatusView
  },
  inject: ['openmct', 'selection'],
  data() {
    return {
      name: '',
      activities: [],
      selectedActivities: [],
      activityExecutionState: undefined,
      heading: ''
    };
  },
  computed: {
    canPersistState() {
      return this.selectedActivities.length === 1 && this.activities?.[0]?.id;
    }
  },
  mounted() {
    this.setFormatters();
    this.getPlanData(this.selection);
    this.getActivityStates();
    this.getActivities();
    this.openmct.selection.on('change', this.updateSelection);
    this.openmct.time.on('timeSystem', this.setFormatters);
  },
  beforeUnmount() {
    this.openmct.selection.off('change', this.updateSelection);
    this.openmct.time.off('timeSystem', this.setFormatters);
    if (this.stopObservingActivityStatesObject) {
      this.stopObservingActivityStatesObject();
    }
  },
  methods: {
    async getActivityStates() {
      this.activityStatesObject = await this.openmct.objects.get('activity-states');
      this.setActivityStates(this.activityStatesObject);
      this.stopObservingActivityStatesObject = this.openmct.objects.observe(
        this.activityStatesObject,
        '*',
        this.setActivityStates
      );
    },
    setActivityStates(newActivitiesStateObject) {
      if (this.activities.length) {
        const id = this.activities[0].id;
        this.activityExecutionState = newActivitiesStateObject.activities[id];
      } else {
        this.activityExecutionState = undefined;
      }
    },
    setFormatters() {
      let timeSystem = this.openmct.time.timeSystem();
      this.timeFormatter = this.openmct.telemetry.getValueFormatter({
        format: timeSystem.timeFormat
      }).formatter;
    },
    updateSelection(newSelection) {
      this.getPlanData(newSelection);
      this.getActivities();
    },
    getPlanData(selection) {
      this.selectedActivities = [];
      selection.forEach((selectionItem) => {
        if (selectionItem[0].context.type === 'activity') {
          const activity = { ...selectionItem[0].context.activity };
          if (activity) {
            activity.key = activity.id ?? activity.name;
            this.selectedActivities.push(activity);
          }
        }
      });
    },
    getActivities() {
      if (this.selectedActivities.length <= 1) {
        this.heading = 'Time';
        this.setSingleActivityProperties();
      } else {
        this.heading = 'Convex Hull';
        this.setMultipleActivityProperties();
      }
    },
    setSingleActivityProperties() {
      this.activities.splice(0);
      this.selectedActivities.forEach((selectedActivity, index) => {
        const activity = {
          id: selectedActivity.id,
          key: selectedActivity.key,
          timeProperties: {
            start: {
              label: propertyLabels.start,
              value: this.formatTime(selectedActivity.start)
            },
            end: {
              label: propertyLabels.end,
              value: this.formatTime(selectedActivity.end)
            },
            duration: {
              label: propertyLabels.duration,
              value: this.formatDuration(selectedActivity.end - selectedActivity.start)
            }
          }
        };
        activity.metadata = {};
        if (selectedActivity.description) {
          activity.metadata.description = {
            label: propertyLabels.description,
            value: selectedActivity.description
          };
        }

        const displayProperties = getDisplayProperties(selectedActivity);
        activity.metadata = {
          ...activity.metadata,
          ...displayProperties
        };

        this.activities[index] = activity;
      });
    },
    sortFn(a, b) {
      const numA = parseInt(a.start, 10);
      const numB = parseInt(b.start, 10);
      if (numA > numB) {
        return 1;
      }

      if (numA < numB) {
        return -1;
      }

      return 0;
    },
    setMultipleActivityProperties() {
      this.activities.splice(0);

      let earliestStart;
      let latestEnd;
      let gap;
      let overlap;
      let id;
      let key;

      //Sort by start time
      let selectedActivities = this.selectedActivities.sort(this.sortFn);
      selectedActivities.forEach((selectedActivity, index) => {
        if (selectedActivities.length === 2 && index > 0) {
          const previous = selectedActivities[index - 1];
          //they're on different rows so there must be overlap
          if (previous.end > selectedActivity.start) {
            overlap = previous.end - selectedActivity.start;
          } else if (previous.end < selectedActivity.start) {
            gap = selectedActivity.start - previous.end;
          }
        }

        if (index > 0) {
          earliestStart = Math.min(earliestStart, selectedActivity.start);
          latestEnd = Math.max(latestEnd, selectedActivity.end);
        } else {
          id = selectedActivity.id;
          key = selectedActivity.id ?? selectedActivity.name;
          earliestStart = selectedActivity.start;
          latestEnd = selectedActivity.end;
        }
      });
      let totalTime = latestEnd - earliestStart;

      const activity = {
        id,
        key,
        timeProperties: {
          earliestStart: {
            label: propertyLabels.earliestStart,
            value: this.formatTime(earliestStart)
          },
          latestEnd: {
            label: propertyLabels.latestEnd,
            value: this.formatTime(latestEnd)
          }
        }
      };

      if (gap) {
        activity.timeProperties.gap = {
          label: propertyLabels.gap,
          value: this.formatDuration(gap)
        };
      } else if (overlap) {
        activity.timeProperties.overlap = {
          label: propertyLabels.overlap,
          value: this.formatDuration(overlap)
        };
      }

      activity.timeProperties.totalTime = {
        label: propertyLabels.totalTime,
        value: this.formatDuration(totalTime)
      };

      this.activities[0] = activity;
    },
    formatDuration(duration) {
      return getPreciseDuration(duration);
    },
    formatTime(time) {
      return this.timeFormatter.format(time);
    },
    persistActivityState(data) {
      const { key, executionState } = data;
      const activitiesPath = `activities.${key}`;
      this.openmct.objects.mutate(this.activityStatesObject, activitiesPath, executionState);
    }
  }
};
</script>
