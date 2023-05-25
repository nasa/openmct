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
  <div class="t-message-list c-overlay__contents">
    <div class="c-overlay__top-bar">
      <div class="c-overlay__dialog-title">Notifications</div>
      <div class="c-overlay__dialog-hint">
        {{ notificationsCountDisplayMessage(notifications.length) }}
      </div>
    </div>
    <div role="list" class="w-messages c-overlay__messages">
      <notification-message
        v-for="(notification, notificationIndex) in notifications"
        :key="notificationIndex"
        :close-overlay="closeOverlay"
        :notification="notification"
        :notifications-count="notifications.length"
      />
    </div>
  </div>
</template>

<script>
import NotificationMessage from './NotificationMessage.vue';

export default {
  components: {
    NotificationMessage
  },
  inject: ['openmct'],
  props: {
    notifications: {
      type: Array,
      required: true
    }
  },
  data() {
    return {};
  },
  mounted() {
    this.openOverlay();
  },
  methods: {
    openOverlay() {
      this.overlay = this.openmct.overlays.overlay({
        element: this.$el,
        size: 'large',
        dismissable: true,
        buttons: [
          {
            label: 'Clear All Notifications',
            emphasis: true,
            callback: () => {
              this.$emit('clear-all');
              this.overlay.dismiss();
            }
          }
        ],
        onDestroy: () => {
          this.$emit('close', false);
        }
      });
    },
    closeOverlay() {
      this.overlay.dismiss();
    },
    notificationsCountDisplayMessage(count) {
      if (count > 1 || count === 0) {
        return `Displaying ${count} notifications`;
      } else {
        return `Displaying ${count} notification`;
      }
    }
  }
};
</script>
