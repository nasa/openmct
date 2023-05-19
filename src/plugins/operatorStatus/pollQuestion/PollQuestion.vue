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
  <div :style="position" class="c-status-poll-panel c-status-poll-panel--admin" @click.stop="noop">
    <div class="c-status-poll-panel__section c-status-poll-panel__top">
      <div class="c-status-poll-panel__title">Manage Status Poll</div>
      <div class="c-status-poll-panel__updated">Last updated: {{ pollQuestionUpdated }}</div>
    </div>

    <div class="c-status-poll__section c-status-poll-panel__content c-spq">
      <!-- Grid layout -->
      <div class="c-spq__label">Current poll:</div>
      <div class="c-spq__value c-status-poll-panel__poll-question">{{ currentPollQuestion }}</div>

      <template v-if="statusCountViewModel.length > 0">
        <div class="c-spq__label">Reporting:</div>
        <div class="c-spq__value c-status-poll-panel__poll-reporting c-status-poll-report">
          <div
            v-for="entry in statusCountViewModel"
            :key="entry.status.key"
            :title="entry.status.label"
            class="c-status-poll-report__count"
            :style="[
              {
                background: entry.status.statusBgColor,
                color: entry.status.statusFgColor
              }
            ]"
          >
            <div class="c-status-poll-report__count-type" :class="entry.status.iconClass"></div>
            <div class="c-status-poll-report__count-value">
              {{ entry.roleCount }}
            </div>
          </div>
          <div class="c-status-poll-report__actions">
            <button
              class="c-button"
              title="Clear the previous poll question"
              @click="clearPollQuestion"
            >
              Clear Poll
            </button>
          </div>
        </div>
      </template>

      <div class="c-spq__label">New poll:</div>
      <div class="c-spq__value c-status-poll-panel__poll-new-question">
        <input v-model="newPollQuestion" type="text" name="newPollQuestion" />
        <button
          class="c-button"
          title="Publish a new poll question and reset previous responses"
          @click="updatePollQuestion"
        >
          Update
        </button>
      </div>
      <div class="c-table c-spq__poll-table">
        <table class="c-table__body">
          <thead class="c-table__header">
            <tr>
              <th>Position</th>
              <th>Status</th>
              <th>Age</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="statusForRole in statusesForRolesViewModel" :key="statusForRole.key">
              <td>
                {{ statusForRole.role }}
              </td>
              <td
                :style="{
                  background: statusForRole.status.statusBgColor,
                  color: statusForRole.status.statusFgColor
                }"
              >
                {{ statusForRole.status.label }}
              </td>
              <td>
                {{ statusForRole.age }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script>
import _ from 'lodash';

export default {
  inject: ['openmct', 'indicator', 'configuration'],
  props: {
    positionX: {
      type: Number,
      required: true
    },
    positionY: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      pollQuestionUpdated: '--',
      pollQuestionTimestamp: undefined,
      currentPollQuestion: '--',
      newPollQuestion: undefined,
      statusCountViewModel: [],
      statusesForRolesViewModel: []
    };
  },
  computed: {
    position() {
      return {
        position: 'absolute',
        left: `${this.positionX}px`,
        top: `${this.positionY}px`
      };
    }
  },
  mounted() {
    this.fetchCurrentPoll();
    this.subscribeToPollQuestion();
    this.fetchStatusSummary();
    this.openmct.user.status.on('statusChange', this.fetchStatusSummary);
  },
  beforeDestroy() {
    this.openmct.user.status.off('statusChange', this.fetchStatusSummary);
    this.openmct.user.status.off('pollQuestionChange', this.setPollQuestion);
  },
  created() {
    this.fetchStatusSummary = _.debounce(this.fetchStatusSummary);
  },
  methods: {
    async fetchCurrentPoll() {
      const pollQuestion = await this.openmct.user.status.getPollQuestion();
      if (pollQuestion !== undefined) {
        this.setPollQuestion(pollQuestion);
      }
    },
    subscribeToPollQuestion() {
      this.openmct.user.status.on('pollQuestionChange', this.setPollQuestion);
    },
    setPollQuestion(pollQuestion) {
      let pollQuestionText = pollQuestion.question;
      if (!pollQuestionText || pollQuestionText === '') {
        pollQuestionText = '--';
        this.indicator.text('No Poll Question');
      } else {
        this.indicator.text(pollQuestionText);
      }

      this.currentPollQuestion = pollQuestionText;
      this.pollQuestionTimestamp = pollQuestion.timestamp;
      this.pollQuestionUpdated = new Date(pollQuestion.timestamp).toISOString();
    },
    async updatePollQuestion() {
      const result = await this.openmct.user.status.setPollQuestion(this.newPollQuestion);
      if (result === true) {
        this.openmct.notifications.info('Successfully set new poll question');
      } else {
        this.openmct.notifications.error('Unable to set new poll question.');
      }

      this.newPollQuestion = undefined;
    },
    async clearPollQuestion() {
      this.currentPollQuestion = undefined;
      await Promise.all([
        this.openmct.user.status.resetAllStatuses(),
        this.openmct.user.status.setPollQuestion()
      ]);
    },
    async fetchStatusSummary() {
      const allStatuses = await this.openmct.user.status.getPossibleStatuses();
      const statusCountMap = allStatuses.reduce((statusToCountMap, status) => {
        statusToCountMap[status.key] = 0;

        return statusToCountMap;
      }, {});
      const allStatusRoles = await this.openmct.user.status.getAllStatusRoles();
      const statusesForRoles = await Promise.all(
        allStatusRoles.map((role) => this.openmct.user.status.getStatusForRole(role))
      );
      statusesForRoles.forEach((status, i) => {
        const currentCount = statusCountMap[status.key];
        statusCountMap[status.key] = currentCount + 1;
      });

      this.statusCountViewModel = allStatuses.map((status) => {
        return {
          status: this.applyStyling(status),
          roleCount: statusCountMap[status.key]
        };
      });
      const defaultStatuses = await Promise.all(
        allStatusRoles.map((role) => this.openmct.user.status.getDefaultStatusForRole(role))
      );
      this.statusesForRolesViewModel = [];
      statusesForRoles.forEach((status, index) => {
        const isDefaultStatus = defaultStatuses[index].key === status.key;
        let statusTimestamp = status.timestamp;
        if (isDefaultStatus) {
          // if the default is selected, set timestamp to undefined
          statusTimestamp = undefined;
        }

        this.statusesForRolesViewModel.push({
          status: this.applyStyling(status),
          role: allStatusRoles[index],
          age: this.formatStatusAge(statusTimestamp, this.pollQuestionTimestamp)
        });
      });
    },
    formatStatusAge(statusTimestamp, pollQuestionTimestamp) {
      if (statusTimestamp === undefined || pollQuestionTimestamp === undefined) {
        return '--';
      }

      const statusAgeInMs = statusTimestamp - pollQuestionTimestamp;
      const absoluteTotalSeconds = Math.floor(Math.abs(statusAgeInMs) / 1000);
      let hours = Math.floor(absoluteTotalSeconds / 3600);
      let minutes = Math.floor((absoluteTotalSeconds - hours * 3600) / 60);
      let secondsString = absoluteTotalSeconds - hours * 3600 - minutes * 60;

      if (statusAgeInMs > 0 || absoluteTotalSeconds === 0) {
        hours = `+ ${hours}`;
      } else {
        hours = `- ${hours}`;
      }

      if (minutes < 10) {
        minutes = `0${minutes}`;
      }

      if (secondsString < 10) {
        secondsString = `0${secondsString}`;
      }

      const statusAgeString = `${hours}:${minutes}:${secondsString}`;

      return statusAgeString;
    },
    applyStyling(status) {
      const stylesForStatus = this.configuration?.statusStyles?.[status.label];

      if (stylesForStatus !== undefined) {
        return {
          ...status,
          ...stylesForStatus
        };
      } else {
        return status;
      }
    },
    noop() {}
  }
};
</script>
