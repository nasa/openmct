/*****************************************************************************
 * Open MCT, Copyright (c) 2014-2023, United States Government
 * as represented by the Administrator of the National Aeronautics and Space
 * Administration. All rights reserved.
 *
 * Open MCT is licensed under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * http://www.apache.org/licenses/LICENSE-2.0.
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS, WITHOUT
 * WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
 * License for the specific language governing permissions and limitations
 * under the License.
 *
 * Open MCT includes source code licensed under additional open source
 * licenses. See the Open Source Licenses file (LICENSES.md) included with
 * this source code distribution or the Licensing information page available
 * at runtime from the About dialog for additional information.
 *****************************************************************************/

import ExampleUserProvider from './ExampleUserProvider';
const AUTO_LOGIN_USER = 'guest';
const STATUS_ROLES = ['test-role-1', 'test-role-2', 'test-role-3'];
const DEFAULT_STATUS_ROLE = STATUS_ROLES[2];

export default function ExampleUserPlugin({autoLoginUser, statusRoles, defaultStatusRole} = {
    autoLoginUser: AUTO_LOGIN_USER,
    statusRoles: STATUS_ROLES,
    defaultStatusRole: DEFAULT_STATUS_ROLE
}) {
    return function install(openmct) {
        const defaultStatusRoleOrFirstItem = statusRoles.includes(defaultStatusRole) ? defaultStatusRole : statusRoles[0];
        const userProvider = new ExampleUserProvider(openmct, {
            statusRoles,
            defaultStatusRole: defaultStatusRoleOrFirstItem
        });

        if (autoLoginUser !== undefined) {
            userProvider.autoLogin(autoLoginUser);
        }

        openmct.user.setProvider(userProvider);
    };
}
