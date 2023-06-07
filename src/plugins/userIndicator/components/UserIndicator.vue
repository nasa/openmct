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
import RoleChannelProvider from '../../../api/user/RoleChannel';
export default {
    inject: ['openmct'],
    data() {
        return {
            userName: undefined,
            role: undefined,
            loggedIn: false
        };
    },

    async mounted() {
        this.getUserInfo();
        RoleChannelProvider.createRoleChannel();
        await this.fetchOrPromptForRole();
    },
    beforeDestroy() {
        RoleChannelProvider.unsubscribeToRole();
    },
    methods: {
        getUserInfo() {
            this.openmct.user.getCurrentUser().then((user) => {
                this.userName = user.getName();
                this.role = this.openmct.user.getActiveRole();
                this.loggedIn = this.openmct.user.isLoggedIn();
            });
        },
        async fetchOrPromptForRole() {
            const UserAPI = this.openmct.user;
            const activeRole = UserAPI.getActiveRole();
            this.selectedRole = activeRole;
            if (!activeRole) {
                // trigger role selection modal
                this.promptForRoleSelection();
            }
            // todo confirm status role

            this.role = await this.openmct.user.status.getStatusRoleForCurrentUser();

        },
        promptForRoleSelection() {
            const allRoles = this.openmct.user.getPossibleRoles();
            const selectionOptions = allRoles.map(x => ({
                key: x,
                name: x
            })).filter(this.openmct.user.canProvideStatusForRole);

            const dialog = this.openmct.overlays.selection({
                selectionOptions,
                iconClass: 'info',
                title: 'Select Role',
                message: 'Please select your role for operator status.',
                currentSelection: this.selectedRole,
                onChange: (event) => {
                    this.selectedRole = event.target.value;
                },
                buttons: [
                    {
                        label: 'Select',
                        emphasis: true,
                        callback: () => {
                            dialog.dismiss();
                            //TODO: introduce a notification of success
                            this.setRole(this.selectedRole);
                        }
                    }
                ]
            });
        },

        setRole(role) {
            this.role = role;
            this.openmct.user.setActiveRole(role);
            // update other tabs through broadcast channel
            RoleChannelProvider.broadcastNewRole(role);
        }

    }
};
</script>
