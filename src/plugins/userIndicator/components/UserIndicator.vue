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
  <div
    ref="userIndicatorRef"
    class="c-indicator c-indicator--user icon-person"
    :class="canSetMissionStatus ? 'clickable' : ''"
    v-bind="$attrs"
    @click.stop="togglePopup"
  >
    <span class="label c-indicator__label" aria-label="User Role">
      {{ role ? `${userName}: ${role}` : userName }}
      <button v-if="availableRoles?.length > 1" @click.stop="promptForRoleSelection">
        Change Role
      </button>
      <button
        v-if="canSetMissionStatus"
        aria-label="Toggle Mission Status Panel"
        @click.stop="togglePopup"
      >
        Mission Status
      </button>
    </span>
  </div>
  <Teleport to="body">
    <div
      v-show="isPopupVisible"
      ref="popupRef"
      class="c-user-control-panel"
      role="dialog"
      aria-label="User Control Panel"
      :style="popupStyle"
    >
      <Suspense>
        <template #default>
          <MissionStatusPopup v-if="canSetMissionStatus" @dismiss="togglePopup" />
        </template>
        <template #fallback>
          <div>Loading...</div>
        </template>
      </Suspense>
    </div>
  </Teleport>
</template>

<script>
import { ref } from 'vue';

import ActiveRoleSynchronizer from '../../../api/user/ActiveRoleSynchronizer.js';
import { useEventListener } from '../../../ui/composables/event.js';
import { useWindowResize } from '../../../ui/composables/resize.js';
import MissionStatusPopup from './MissionStatusPopup.vue';

export default {
  name: 'UserIndicator',
  components: {
    MissionStatusPopup
  },
  inject: ['openmct'],
  inheritAttrs: false,
  setup() {
    const { windowSize } = useWindowResize();
    const isPopupVisible = ref(false);
    const userIndicatorRef = ref(null);
    const popupRef = ref(null);

    // eslint-disable-next-line func-style
    const handleOutsideClick = (event) => {
      if (isPopupVisible.value && popupRef.value && !popupRef.value.contains(event.target)) {
        isPopupVisible.value = false;
      }
    };

    useEventListener(document, 'click', handleOutsideClick);

    return { windowSize, isPopupVisible, popupRef, userIndicatorRef };
  },
  data() {
    return {
      userName: undefined,
      role: undefined,
      availableRoles: [],
      loggedIn: false,
      inputRoleSelection: undefined,
      roleSelectionDialog: undefined,
      canSetMissionStatus: false
    };
  },
  computed: {
    popupStyle() {
      return {
        top: `${this.position.top}px`,
        left: `${this.position.left}px`
      };
    },
    position() {
      if (!this.isPopupVisible) {
        return { top: 0, left: 0 };
      }
      const indicator = this.userIndicatorRef;
      const indicatorRect = indicator.getBoundingClientRect();
      let top = indicatorRect.bottom;
      let left = indicatorRect.left;

      const popupRect = this.popupRef.getBoundingClientRect();
      const popupWidth = popupRect.width;
      const popupHeight = popupRect.height;

      // Check if the popup goes beyond the right edge of the window
      if (left + popupWidth > this.windowSize.width) {
        left = this.windowSize.width - popupWidth; // Adjust left to fit within the window
      }

      // Check if the popup goes beyond the bottom edge of the window
      if (top + popupHeight > this.windowSize.height) {
        top = indicatorRect.top - popupHeight; // Place popup above the indicator
      }

      return { top, left };
    }
  },
  async created() {
    await this.getUserInfo();
  },
  mounted() {
    // need to wait for openmct to be loaded before using openmct.overlays.selection
    // as document.body could be null
    this.openmct.on('start', this.fetchOrPromptForRole);
    this.roleChannel = new ActiveRoleSynchronizer(this.openmct);
    this.roleChannel.subscribeToRoleChanges(this.onRoleChange);
  },
  beforeUnmount() {
    this.roleChannel.unsubscribeFromRoleChanges(this.onRoleChange);
    this.openmct.off('start', this.fetchOrPromptForRole);
  },
  methods: {
    async getUserInfo() {
      const user = await this.openmct.user.getCurrentUser();
      this.canSetMissionStatus = await this.openmct.user.status.canSetMissionStatus();
      this.userName = user.getName();
      this.role = this.openmct.user.getActiveRole();
      this.loggedIn = this.openmct.user.isLoggedIn();
    },
    async fetchOrPromptForRole() {
      const UserAPI = this.openmct.user;
      const activeRole = UserAPI.getActiveRole();
      this.role = activeRole;
      this.availableRoles = await this.openmct.user.getPossibleRoles();

      // clear role if it's not in list of available roles, e.g., removed by admin
      if (!this.availableRoles?.includes(this.role)) {
        this.role = null;
        UserAPI.setActiveRole(null);
      }

      // see if we need to prompt for role selection
      if (!this.role) {
        this.promptForRoleSelection();
      } else {
        // only notify the user if they have more than one role available
        if (this.availableRoles.length > 1) {
          this.openmct.notifications.info(`You're logged in as role ${activeRole}`);
        }
      }
    },
    promptForRoleSelection() {
      const selectionOptions = this.availableRoles.map((role) => ({
        key: role,
        name: role
      }));
      // automatically select only role option
      if (selectionOptions.length === 0) {
        return;
      }
      if (selectionOptions.length === 1) {
        this.updateRole(selectionOptions[0].key);
        return;
      }

      this.roleSelectionDialog = this.openmct.overlays.selection({
        selectionOptions,
        iconClass: 'alert',
        title: 'Select Role',
        message: '',
        currentSelection: this.role,
        onChange: (event) => {
          this.inputRoleSelection = event.target.value;
        },
        buttons: [
          {
            label: 'Select',
            emphasis: true,
            callback: () => {
              this.roleSelectionDialog.dismiss();
              this.roleSelectionDialog = undefined;
              const inputValueOrDefault = this.inputRoleSelection || selectionOptions[0].key;
              this.updateRole(inputValueOrDefault);
              this.openmct.notifications.info(`Successfully set new role to ${this.role}`);
            }
          }
        ]
      });
    },
    onRoleChange(event) {
      const role = event.data;
      this.roleSelectionDialog?.dismiss();
      this.setRoleSelection(role);
    },
    setRoleSelection(role) {
      this.role = role;
    },

    updateRole(role) {
      this.setRoleSelection(role);
      this.openmct.user.setActiveRole(role);
      // update other tabs through broadcast channel
      this.roleChannel.broadcastNewRole(role);
    },
    togglePopup() {
      this.isPopupVisible = !this.isPopupVisible && this.canSetMissionStatus;
    }
  }
};
</script>
