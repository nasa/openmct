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
  <div
    :style="position"
    class="c-status-poll-panel c-status-poll-panel--operator"
    @click.stop="noop"
  >
    <div class="c-status-poll-panel__section c-status-poll-panel__top">
      <div class="c-status-poll-panel__title">Status Poll</div>
      <div class="c-status-poll-panel__user-role icon-person">{{ role }}</div>
      <div class="c-status-poll-panel__updated">{{ pollQuestionUpdated }}</div>
    </div>

    <div class="c-status-poll-panel__section c-status-poll-panel__poll-question">
      {{ currentPollQuestion }}
    </div>

    <div class="c-status-poll-panel__section c-status-poll-panel__bottom">
      <div class="c-status-poll-panel__set-status-label">My status:</div>
      <select v-model="selectedStatus" name="setStatus" @change="changeStatus">
        <option v-for="status in allStatuses" :key="status.key" :value="status.key">
          {{ status.label }}
        </option>
      </select>
    </div>
  </div>
</template>

<script>
const DEFAULT_POLL_QUESTION = 'NO POLL QUESTION';
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
      role: '--',
      pollQuestionUpdated: '--',
      currentPollQuestion: DEFAULT_POLL_QUESTION,
      selectedStatus: undefined,
      allStatuses: []
    };
  },
  computed: {
    position() {
      return {
        position: 'absolute',
        left: `${this.positionX}px`,
        top: `${this.positionY}px`
      };
    },
    canProvideStatusForRole() {
      return this.openmct.user.canProvideStatusForRole(this.role);
    }
  },
  beforeUnmount() {
    this.openmct.user.status.off('statusChange', this.setStatus);
    this.openmct.user.status.off('pollQuestionChange', this.setPollQuestion);
    this.openmct.user.off('roleChanged', this.fetchMyStatus);
  },
  async mounted() {
    this.unsubscribe = [];
    await this.fetchUser();
    this.fetchPossibleStatusesForUser();
    this.fetchCurrentPoll();
    await this.fetchMyStatus();
    this.subscribeToMyStatus();
    this.subscribeToPollQuestion();
    this.subscribeToRoleChange();
  },
  methods: {
    async fetchUser() {
      this.user = await this.openmct.user.getCurrentUser();
    },
    async fetchCurrentPoll() {
      const pollQuestion = await this.openmct.user.status.getPollQuestion();
      if (pollQuestion !== undefined) {
        this.setPollQuestion(pollQuestion);
      }
    },
    async fetchPossibleStatusesForUser() {
      this.allStatuses = await this.openmct.user.status.getPossibleStatuses();
    },
    setPollQuestion(pollQuestion) {
      this.currentPollQuestion = pollQuestion.question;
      this.pollQuestionUpdated = new Date(pollQuestion.timestamp).toISOString();

      this.indicator.text(pollQuestion?.question || '');
    },
    async fetchMyStatus() {
      // hide indicator for observer
      const isStatusCapable = await this.openmct.user.canProvideStatusForRole();
      if (!isStatusCapable) {
        this.indicator.text('');
        this.indicator.statusClass('hidden');

        return;
      }

      const activeRole = await this.openmct.user.getActiveRole();
      if (!activeRole) {
        return;
      }

      this.role = activeRole;
      const status = await this.openmct.user.status.getStatusForRole(activeRole);
      if (status !== undefined) {
        this.setStatus({ status });
      }
    },
    subscribeToMyStatus() {
      this.openmct.user.status.on('statusChange', this.setStatus);
    },
    subscribeToPollQuestion() {
      this.openmct.user.status.on('pollQuestionChange', this.setPollQuestion);
    },
    subscribeToRoleChange() {
      this.openmct.user.on('roleChanged', this.fetchMyStatus);
    },
    setStatus({ status }) {
      status = this.applyStyling(status);
      this.selectedStatus = status.key;
      this.indicator.iconClass(status.iconClassPoll);
      this.indicator.statusClass(status.statusClass);
      if (this.isDefaultStatus(status)) {
        this.indicator.text(this.currentPollQuestion);
      } else {
        this.indicator.text(status.label);
      }
    },
    isDefaultStatus(status) {
      return status.key === this.allStatuses[0].key;
    },
    findStatusByKey(statusKey) {
      return this.allStatuses.find((possibleMatch) => possibleMatch.key === statusKey);
    },
    async changeStatus() {
      if (!this.openmct.user.canProvideStatusForRole()) {
        this.openmct.notifications.error('Selected role is ineligible to provide operator status');

        return;
      }

      if (this.selectedStatus !== undefined) {
        const statusObject = this.findStatusByKey(this.selectedStatus);

        const result = await this.openmct.user.status.setStatusForRole(statusObject);
        if (result === true) {
          this.openmct.notifications.info('Successfully set operator status');
        } else {
          this.openmct.notifications.error('Unable to set operator status');
        }
      }
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
