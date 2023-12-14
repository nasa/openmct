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
  <div class="c-indicator icon-person c-indicator--clickable">
    <span class="label c-indicator__label">
      {{ role ? `${userName}: ${role}` : userName }}
      <button v-if="availableRoles?.length > 1" @click="promptForRoleSelection">Change Role</button>
    </span>
  </div>
</template>

<script>
import ActiveRoleSynchronizer from '../../../api/user/ActiveRoleSynchronizer';
export default {
  inject: ['openmct'],
  data() {
    return {
      userName: undefined,
      role: undefined,
      availableRoles: [],
      loggedIn: false,
      inputRoleSelection: undefined,
      roleSelectionDialog: undefined
    };
  },

  async mounted() {
    await this.getUserInfo();
    this.roleChannel = new ActiveRoleSynchronizer(this.openmct);
    this.roleChannel.subscribeToRoleChanges(this.onRoleChange);
    await this.fetchOrPromptForRole();
  },
  beforeUnmount() {
    this.roleChannel.unsubscribeFromRoleChanges(this.onRoleChange);
  },
  methods: {
    async getUserInfo() {
      const user = await this.openmct.user.getCurrentUser();
      this.userName = user.getName();
      this.role = this.openmct.user.getActiveRole();
      this.availableRoles = await this.openmct.user.getPossibleRoles();
      this.loggedIn = this.openmct.user.isLoggedIn();
    },
    async fetchOrPromptForRole() {
      const UserAPI = this.openmct.user;
      const activeRole = UserAPI.getActiveRole();
      this.role = activeRole;
      if (!activeRole) {
        this.promptForRoleSelection();
      } else {
        // only notify the user if they have more than one role available
        this.availableRoles = await this.openmct.user.getPossibleRoles();
        if (this.availableRoles.length > 1) {
          this.openmct.notifications.info(`You're logged in as role ${activeRole}`);
        }
      }
    },
    async promptForRoleSelection() {
      this.availableRoles = await this.openmct.user.getPossibleRoles();
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
    }
  }
};
</script>
