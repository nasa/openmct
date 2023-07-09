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
    v-if="notifications.length > 0 || showNotificationsOverlay"
    class="c-indicator c-indicator--clickable icon-bell"
    :class="[severityClass]"
  >
    <span class="c-indicator__label">
      <button
        :aria-label="'Review ' + notificationsCountMessage(notifications.length)"
        @click="toggleNotificationsList(true)"
      >
        {{ notificationsCountMessage(notifications.length) }}
      </button>
      <button aria-label="Clear all notifications" @click="dismissAllNotifications()">
        Clear All
      </button>
    </span>
    <span class="c-indicator__count">{{ notifications.length }}</span>

    <notifications-list
      v-if="showNotificationsOverlay"
      :notifications="notifications"
      @close="toggleNotificationsList"
      @clear-all="dismissAllNotifications"
    />
  </div>
</template>

<script>
import NotificationsList from './NotificationsList.vue';

export default {
  components: {
    NotificationsList
  },
  inject: ['openmct'],
  data() {
    return {
      notifications: this.openmct.notifications.notifications,
      highest: this.openmct.notifications.highest,
      showNotificationsOverlay: false
    };
  },
  computed: {
    severityClass() {
      return `s-status-${this.highest.severity}`;
    }
  },
  mounted() {
    this.openmct.notifications.on('notification', this.updateNotifications);
    this.openmct.notifications.on('dismiss-all', this.updateNotifications);
  },
  methods: {
    dismissAllNotifications() {
      this.openmct.notifications.dismissAllNotifications();
    },
    toggleNotificationsList(flag) {
      this.showNotificationsOverlay = flag;
    },
    updateNotifications() {
      this.notifications = [...this.openmct.notifications.notifications];
      this.highest = this.openmct.notifications.highest;
    },
    notificationsCountMessage(count) {
      if (count > 1) {
        return `${count} Notifications`;
      } else {
        return `${count} Notification`;
      }
    }
  }
};
</script>
