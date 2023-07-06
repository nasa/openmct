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
      <button @click="promptForRoleSelection">Change Role</button>
    </span>
  </div>
</template>

<script>
import RoleChannel from '../../../api/user/RoleChannel';
export default {
  inject: ['openmct'],
  data() {
    return {
      userName: undefined,
      role: undefined,
      loggedIn: false,
      roleChannel: undefined,
      inputRoleSelection: undefined
    };
  },

  async mounted() {
    this.getUserInfo();
    this.roleChannel = new RoleChannel(this.openmct);
    this.roleChannel.createRoleChannel();
    this.roleChannel.subscribeToRole(this.setRoleSelection);
    await this.fetchOrPromptForRole();
  },
  beforeDestroy() {
    this.roleChannel.unsubscribeToRole();
  },
  methods: {
    async getUserInfo() {
      const user = await this.openmct.user.getCurrentUser();
      this.userName = user.getName();
      this.role = this.openmct.user.getActiveRole();
      this.loggedIn = this.openmct.user.isLoggedIn();
    },
    fetchOrPromptForRole() {
      const UserAPI = this.openmct.user;
      const activeRole = UserAPI.getActiveRole();
      this.role = activeRole;
      if (!activeRole) {
        this.promptForRoleSelection();
      }
    },
    promptForRoleSelection() {
      const allRoles = this.openmct.user.getPossibleRoles();
      const selectionOptions = allRoles.map((role) => ({
        key: role,
        name: role
      }));

      const dialog = this.openmct.overlays.selection({
        selectionOptions,
        iconClass: 'info',
        title: 'Select Role',
        message: 'Please select your role for operator status.',
        currentSelection: this.role,
        onChange: (event) => {
          this.inputRoleSelection = event.target.value;
        },
        buttons: [
          {
            label: 'Select',
            emphasis: true,
            callback: () => {
              dialog.dismiss();
              const inputValueOrDefault = this.inputRoleSelection || selectionOptions[0].key;
              this.updateRole(inputValueOrDefault);
              this.openmct.notifications.info(`Successfully set new role to ${this.role}`);
            }
          }
        ]
      });
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
