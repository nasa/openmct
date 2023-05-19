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
  <div class="c-message" role="listitem" :class="'message-severity-' + notification.model.severity">
    <div class="c-ne__time-and-content">
      <div class="c-ne__time">
        <span>{{ notification.model.timestamp }}</span>
      </div>
      <div class="c-ne__content">
        <div class="w-message-contents">
          <div class="c-message__top-bar">
            <div class="c-message__title">{{ notification.model.message }}</div>
          </div>
          <div class="message-body">
            <progress-bar v-if="isProgressNotification" :model="progressObject" />
          </div>
        </div>
      </div>
      <button
        :aria-label="'Dismiss notification of ' + notification.model.message"
        class="c-click-icon c-overlay__close-button icon-x"
        @click="dismiss()"
      ></button>
      <div class="c-overlay__button-bar">
        <button
          v-for="(dialogOption, index) in notification.model.options"
          :key="index"
          class="c-button"
          @click="dialogOption.callback()"
        >
          {{ dialogOption.label }}
        </button>
        <button
          v-if="notification.model.primaryOption"
          class="c-button c-button--major"
          @click="notification.model.primaryOption.callback()"
        >
          {{ notification.model.primaryOption.label }}
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import ProgressBar from '../../../ui/components/ProgressBar.vue';

export default {
  components: {
    ProgressBar
  },
  props: {
    notification: {
      type: Object,
      required: true
    },
    closeOverlay: {
      type: Function,
      required: true
    },
    notificationsCount: {
      type: Number,
      required: true
    }
  },
  data() {
    return {
      isProgressNotification: false,
      progressPerc: this.notification.model.progressPerc,
      progressText: this.notification.model.progressText
    };
  },
  computed: {
    progressObject() {
      return {
        progressPerc: this.progressPerc,
        progressText: this.progressText
      };
    }
  },
  mounted() {
    if (this.notification.model.progressPerc) {
      this.isProgressNotification = true;
      this.notification.on('progress', this.updateProgressBar);
    }
  },
  methods: {
    updateProgressBar(progressPerc, progressText) {
      this.progressPerc = progressPerc;
      this.progressText = progressText;
    },
    dismiss() {
      this.notification.dismiss();
      if (this.notificationsCount === 1) {
        this.closeOverlay();
      }
    }
  }
};
</script>
